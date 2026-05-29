#!/usr/bin/env python3
"""
NeatDuck_Timeline public data updater.

What it does:
1. Fetches Leek Duck's public events page.
2. Reads event cards and, when needed, follows individual event pages to collect start/end dates.
3. Compares the freshly scraped events with data/events.csv and data/events.manual.csv.
4. Writes an accumulated historical data/events.csv instead of deleting old events.

The output CSV intentionally keeps the core columns expected by the extension:
title, shortTitle, category, lane, sub, start, endKnown, endInferred, href
Additional metadata columns are allowed; the extension ignores columns it does not need.
"""
from __future__ import annotations

import csv
import hashlib
import html
import json
import os
import re
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
CACHE_PATH = DATA_DIR / "detail_cache.json"
EVENTS_PATH = DATA_DIR / "events.csv"
MANUAL_PATH = DATA_DIR / "events.manual.csv"
MANIFEST_PATH = DATA_DIR / "manifest.json"
SNAPSHOT_PATH = DATA_DIR / "snapshot-latest.json"

SOURCE_URL = os.environ.get("LEEKDUCK_EVENTS_URL", "https://leekduck.com/events/")
REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "20"))
MAX_DETAIL_PAGES = int(os.environ.get("MAX_DETAIL_PAGES", "120"))
DETAIL_SLEEP_SECONDS = float(os.environ.get("DETAIL_SLEEP_SECONDS", "0.20"))

CSV_COLUMNS = [
    "uid",
    "title", "shortTitle", "category", "lane", "sub",
    "start", "endKnown", "endInferred", "href",
    "source", "firstSeenAt", "lastSeenAt", "lastScrapedAt", "status",
]
CORE_COLUMNS = ["title", "shortTitle", "category", "lane", "sub", "start", "endKnown", "endInferred", "href"]

UA = (
    "NeatDuck_Timeline/1.0 (+https://github.com/Yang-Zhang-717/NeatDuck_Timeline; "
    "public schedule updater; contact via GitHub issues)"
)

DATE_RE = re.compile(
    r"(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}"
    r"(?:,\s+at\s+\d{1,2}:\d{2}\s+[AP]M)?\s+Local Time",
    re.I,
)

NOISE_RE = re.compile(
    r"\b(?:Starts|Ends):\s*\d+\s*days?\s*\d+\s*hours?\s*\d+\s*min\b|"
    r"\bCalculating\.\.\.\b|\bAdvertisement\b",
    re.I,
)

@dataclass
class EventRecord:
    title: str = ""
    shortTitle: str = ""
    category: str = ""
    lane: str = ""
    sub: str = ""
    start: str = ""
    endKnown: str = ""
    endInferred: str = ""
    href: str = ""
    uid: str = ""
    source: str = "leekduck"
    firstSeenAt: str = ""
    lastSeenAt: str = ""
    lastScrapedAt: str = ""
    status: str = "active"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clean_text(value: str) -> str:
    value = html.unescape(value or "")
    value = NOISE_RE.sub(" ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def safe_url(href: str, base: str = SOURCE_URL) -> str:
    if not href:
        return ""
    url = urljoin(base, href)
    p = urlparse(url)
    if p.scheme not in {"http", "https"}:
        return ""
    return url.split("#", 1)[0]


def parse_dt(value: str) -> Optional[datetime]:
    value = clean_text(value or "")
    if not value:
        return None
    value = value.replace("Local Time", "")
    value = value.replace(", at", " ")
    value = re.sub(r"\s+", " ", value).strip()
    # LeekDuck dates usually omit the year on list cards. Assume the current year, and if that
    # puts the event implausibly far in the past, roll forward one year.
    default = datetime.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    try:
        dt = dateparser.parse(value, fuzzy=True, default=default)
    except Exception:
        return None
    if not dt:
        return None
    # LeekDuck commonly labels event times as "Local Time". Store these as
    # floating local datetimes, not absolute UTC instants, so each user's browser
    # can render them in the user's own local timezone. Yes, timezones remain
    # humanity's most successful practical joke.
    dt = dt.replace(tzinfo=None)
    today = datetime.now().replace(tzinfo=None)
    if dt < today - timedelta(days=180):
        try:
            dt = dt.replace(year=dt.year + 1)
        except ValueError:
            pass
    return dt


def to_iso(dt: Optional[datetime]) -> str:
    if not dt:
        return ""
    # Do not append Z here. The extension treats YYYY-MM-DDTHH:mm:ss as local time.
    return dt.replace(tzinfo=None, microsecond=0).isoformat(timespec="seconds")


def from_iso(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = dateparser.parse(value.replace("Z", "+00:00"))
        return dt.replace(tzinfo=None) if dt else None
    except Exception:
        return None


def infer_end(title: str, category: str, sub: str, start_iso: str) -> str:
    start = from_iso(start_iso)
    if not start:
        return ""
    hay = f"{title} {category} {sub}".lower()
    if "raid hour" in hay or "spotlight hour" in hay:
        return to_iso(start + timedelta(hours=1))
    if "max monday" in hay or "max mondays" in hay:
        return to_iso(start + timedelta(hours=15))
    if "community day" in hay:
        return to_iso(start + timedelta(hours=3))
    if "raid day" in hay or "hatch day" in hay:
        return to_iso(start + timedelta(hours=3))
    if "go fest" in hay or "safari" in hay:
        return to_iso(start + timedelta(days=2))
    if "season" in hay:
        return to_iso(start + timedelta(days=90))
    return to_iso(start + timedelta(days=1))


def choose_lane_sub(title: str, category: str) -> Tuple[str, str]:
    hay = f"{category} {title}".lower()
    cat = clean_text(category)
    if "mega" in hay and "raid" in hay:
        return "raids", "Mega Raid Battles"
    if "shadow" in hay and "raid" in hay:
        return "raids", "Shadow Raid Battles"
    if "raid hour" in hay:
        return "weekly", "Raid Hour"
    if "raid" in hay:
        return "raids", "5-Star Raid Battles"
    if "max monday" in hay or "dynamax" in hay or "gigantamax" in hay:
        return "weekly", "Max Mondays"
    if "spotlight" in hay:
        return "weekly", "Pokémon Spotlight Hour"
    if "battle league" in hay or "gbl" in hay:
        return "gbl", "GO Battle League"
    if "go pass" in hay:
        return "go-pass", "GO Pass"
    if "season" in hay:
        return "season", "Season"
    if "community day" in hay:
        return "community", "Community Day"
    if "go fest" in hay:
        return "city", "Pokémon GO Fest"
    if "safari" in hay:
        return "city", "City Safari"
    return "theme", cat or "Event"


def pokemonish_title_part(title: str) -> str:
    text = title
    patterns = [
        r"(.+?)\s+in\s+(?:Mega|5-star|Shadow)\s+Raids?",
        r"(?:Dynamax|Gigantamax)\s+(.+?)\s+during\s+Max\s+Monday",
        r"(.+?)\s+Raid\s+Hour",
        r"(.+?)\s+Community\s+Day",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if m:
            return clean_text(m.group(1))
    return clean_text(text)


def short_title(title: str, category: str, sub: str) -> str:
    title = clean_text(title)
    sub_l = (sub or "").lower()
    if "max monday" in sub_l:
        name = pokemonish_title_part(title)
        if name.lower().startswith("max "):
            return name
        return f"Max {name}"
    if "mega raid" in sub_l:
        name = pokemonish_title_part(title)
        if re.match(r"^(Mega|超级|超級)\b", name, re.I):
            return name
        return f"Mega {name}"
    if "raid" in sub_l:
        return pokemonish_title_part(title)
    if "battle league" in sub_l:
        return re.sub(r"^GO Battle League\s*", "", title, flags=re.I).strip() or title
    return title


def uid_for(e: EventRecord) -> str:
    key = "|".join([
        clean_text(e.title).lower(),
        clean_text(e.category).lower(),
        e.start[:10] if e.start else "",
        safe_url(e.href),
    ])
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def load_cache() -> Dict[str, dict]:
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_cache(cache: Dict[str, dict]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def fetch_html(url: str) -> str:
    r = requests.get(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"}, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    return r.text


def detail_dates(href: str, cache: Dict[str, dict]) -> Tuple[Optional[datetime], Optional[datetime]]:
    href = safe_url(href)
    if not href:
        return None, None
    cached = cache.get(href)
    if cached and (cached.get("start") or cached.get("end")):
        return from_iso(cached.get("start", "")), from_iso(cached.get("end", ""))
    html_text = fetch_html(href)
    soup = BeautifulSoup(html_text, "html.parser")

    def pick(section_id: str) -> Optional[datetime]:
        sec = soup.select_one(f"#{section_id}")
        if not sec:
            return None
        date_el = sec.select_one("span[data-event-page-date], span[data-event-page-data]")
        time_el = sec.select_one("span[data-event-page-time]")
        date_txt = ""
        time_txt = ""
        if date_el:
            date_txt = date_el.get("data-event-page-date") or date_el.get("data-event-page-data") or date_el.get_text(" ")
        if time_el:
            time_txt = time_el.get("data-event-page-time") or time_el.get_text(" ")
        return parse_dt(f"{date_txt} {time_txt}")

    start = pick("start-text")
    end = pick("end-text")
    cache[href] = {"start": to_iso(start), "end": to_iso(end), "cachedAt": now_iso()}
    return start, end


def probable_cards(soup: BeautifulSoup) -> List:
    selectors = [
        "span.event-header-item-wrapper",
        "article",
        ".event-card",
        ".events-list .event",
        "a[href*='/events/']",
    ]
    seen = set()
    cards = []
    for sel in selectors:
        for node in soup.select(sel):
            key = id(node)
            if key in seen:
                continue
            seen.add(key)
            text = clean_text(node.get_text(" "))
            href_el = node if node.name == "a" else node.select_one("a[href]")
            href = safe_url(href_el.get("href") if href_el else "")
            if not href or href.rstrip("/") == SOURCE_URL.rstrip("/"):
                continue
            if "/events/" not in urlparse(href).path:
                continue
            if len(text) < 8:
                continue
            cards.append(node)
    return cards


def extract_title_category(card) -> Tuple[str, str]:
    title_el = card.select_one("h2,h3,.event-title") if hasattr(card, "select_one") else None
    title = clean_text(title_el.get_text(" ") if title_el else "")
    cat_el = card.select_one("p.badge,.badge,.label,.category,.event-type,.event-item-wrapper > p,p") if hasattr(card, "select_one") else None
    category = clean_text(cat_el.get_text(" ") if cat_el else "")

    text = clean_text(card.get_text(" "))
    if not title:
        # Common LeekDuck card text repeats the category first, e.g. "Raid Hour Raid Hour Tapu Fini Raid Hour ...".
        m = DATE_RE.search(text)
        before_date = text[:m.start()].strip() if m else text
        tokens = before_date.split()
        # If first few words repeat, remove the repeated category-ish prefix.
        if len(tokens) >= 4 and tokens[0:2] == tokens[2:4]:
            category = category or " ".join(tokens[0:2])
            title = " ".join(tokens[4:])
        elif len(tokens) >= 2 and tokens[0].lower() == tokens[1].lower():
            category = category or tokens[0]
            title = " ".join(tokens[2:])
        else:
            title = before_date
    if category and title.lower().startswith(category.lower() + " "):
        title = clean_text(title[len(category):])
    title = DATE_RE.sub(" ", title)
    title = clean_text(title)
    return title, category


def extract_card_dates(card, section_hint: str = "") -> Tuple[Optional[datetime], Optional[datetime]]:
    start = end = None
    if hasattr(card, "select_one"):
        time_el = card.select_one("h5,time,[data-event-start-date],p[data-event-list-date]")
        if time_el:
            start = parse_dt(time_el.get("data-event-start-date-check") or time_el.get("data-event-start-date") or time_el.get("datetime") or time_el.get("data-event-list-date") or "")
            end = parse_dt(time_el.get("data-event-end-date") or "")
    text = clean_text(card.get_text(" "))
    date_match = DATE_RE.search(text)
    if date_match:
        dt = parse_dt(date_match.group(0))
        if dt and not start and section_hint == "upcoming":
            start = dt
        elif dt and not end and section_hint == "happening":
            end = dt
        elif dt and not start:
            start = dt
    return start, end


def detect_section(card) -> str:
    # Walk backward through siblings/parents looking for the visible section heading.
    node = card
    for _ in range(6):
        prev = node.find_previous(["h1", "h2"])
        if not prev:
            break
        txt = clean_text(prev.get_text(" ")).lower()
        if "upcoming" in txt:
            return "upcoming"
        if "happening" in txt or "live now" in txt:
            return "happening"
        node = prev
    return ""


def scrape_events() -> Tuple[List[EventRecord], Dict[str, dict]]:
    html_text = fetch_html(SOURCE_URL)
    soup = BeautifulSoup(html_text, "html.parser")
    cache = load_cache()
    cards = probable_cards(soup)
    events: List[EventRecord] = []
    detail_fetches = 0

    for card in cards:
        href_el = card if getattr(card, "name", None) == "a" else card.select_one("a[href]")
        href = safe_url(href_el.get("href") if href_el else "")
        if not href:
            continue
        title, category = extract_title_category(card)
        if not title or re.search(r"^(events?|live now|upcoming|all)$", title, re.I):
            continue

        section = detect_section(card)
        start_dt, end_dt = extract_card_dates(card, section)

        if (not start_dt or not end_dt) and detail_fetches < MAX_DETAIL_PAGES:
            try:
                ds, de = detail_dates(href, cache)
                detail_fetches += 1
                if not start_dt and ds:
                    start_dt = ds
                if not end_dt and de:
                    end_dt = de
                time.sleep(DETAIL_SLEEP_SECONDS)
            except Exception as exc:
                print(f"warning: failed to read detail page {href}: {exc}", file=sys.stderr)

        lane, sub = choose_lane_sub(title, category)
        rec = EventRecord(
            title=title,
            category=category or sub,
            lane=lane,
            sub=sub,
            start=to_iso(start_dt),
            endKnown=to_iso(end_dt),
            href=href,
            source="leekduck",
            lastScrapedAt=now_iso(),
            status="active",
        )
        rec.shortTitle = short_title(rec.title, rec.category, rec.sub)
        if rec.start and not rec.endKnown:
            rec.endInferred = infer_end(rec.title, rec.category, rec.sub, rec.start)
        rec.uid = uid_for(rec)
        events.append(rec)

    save_cache(cache)
    return dedupe(events), cache


def dedupe(events: Iterable[EventRecord]) -> List[EventRecord]:
    out: Dict[str, EventRecord] = {}
    for e in events:
        if not e.uid:
            e.uid = uid_for(e)
        prev = out.get(e.uid)
        if not prev:
            out[e.uid] = e
            continue
        for k, v in asdict(e).items():
            if v and not getattr(prev, k, ""):
                setattr(prev, k, v)
            elif v and k in {"title", "shortTitle", "category", "lane", "sub", "start", "endKnown", "endInferred", "href", "lastScrapedAt", "status"}:
                setattr(prev, k, v)
    return list(out.values())


def read_events(path: Path) -> List[EventRecord]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    rows: List[EventRecord] = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data = {k: (row.get(k) or "") for k in CSV_COLUMNS}
            for k in CORE_COLUMNS:
                data[k] = row.get(k, data.get(k, "")) or ""
            rec = EventRecord(**data)
            if not rec.title and not rec.href:
                continue
            if not rec.lane or not rec.sub:
                rec.lane, rec.sub = choose_lane_sub(rec.title, rec.category)
            if not rec.shortTitle:
                rec.shortTitle = short_title(rec.title, rec.category, rec.sub)
            if not rec.uid:
                rec.uid = uid_for(rec)
            rows.append(rec)
    return rows


def merge_library(existing: List[EventRecord], manual: List[EventRecord], fresh: List[EventRecord]) -> List[EventRecord]:
    ts = now_iso()
    by_uid: Dict[str, EventRecord] = {}

    def put(e: EventRecord, active: bool = False, manual_source: bool = False) -> None:
        if not e.uid:
            e.uid = uid_for(e)
        prev = by_uid.get(e.uid)
        if not prev:
            e.firstSeenAt = e.firstSeenAt or ts
            e.lastSeenAt = e.lastSeenAt or (ts if active else "")
            e.lastScrapedAt = e.lastScrapedAt or (ts if active else "")
            if active:
                e.status = "active"
            elif not e.status:
                e.status = "archived"
            by_uid[e.uid] = e
            return
        for field in ["title", "shortTitle", "category", "lane", "sub", "start", "endKnown", "endInferred", "href"]:
            value = getattr(e, field, "")
            if value:
                setattr(prev, field, value)
        prev.source = "manual" if manual_source else (e.source or prev.source or "leekduck")
        prev.firstSeenAt = prev.firstSeenAt or e.firstSeenAt or ts
        if active:
            prev.lastSeenAt = ts
            prev.lastScrapedAt = ts
            prev.status = "active"
        elif not prev.status:
            prev.status = e.status or "archived"

    for e in existing:
        # Anything not encountered in the fresh scrape remains in the CSV as historical data.
        if not e.status or e.status == "active":
            e.status = "archived"
        put(e, active=False)
    for e in manual:
        e.source = "manual"
        e.status = e.status or "manual"
        put(e, active=False, manual_source=True)
    fresh_uids = set()
    for e in fresh:
        fresh_uids.add(e.uid)
        put(e, active=True)

    records = list(by_uid.values())

    # CSV/table ordering policy:
    # 1. currently active or future events first, nearest start time first;
    # 2. ended historical events next, newest old event first;
    # 3. undated rows last.
    # This makes the public table useful as both a current feed and a long-term archive,
    # because apparently humans prefer not spelunking through 800 ancient rows to find tomorrow.
    now_local = datetime.now().replace(tzinfo=None, microsecond=0)

    def event_start(e: EventRecord) -> Optional[datetime]:
        return from_iso(e.start)

    def event_end(e: EventRecord) -> Optional[datetime]:
        return from_iso(e.endKnown) or from_iso(e.endInferred) or event_start(e)

    def seconds(dt: Optional[datetime], fallback: float = 0.0) -> float:
        if not dt:
            return fallback
        return dt.timestamp()

    def table_sort_key(e: EventRecord):
        start_dt = event_start(e)
        end_dt = event_end(e)
        if start_dt or end_dt:
            # Future/current bucket. Sort by soonest upcoming start.
            if (end_dt and end_dt >= now_local) or (start_dt and start_dt >= now_local):
                return (0, seconds(start_dt or end_dt, 10**15), e.lane or "zz", e.sub or "zz", e.title.lower())
            # Historical bucket. Sort newest old events above older old events.
            return (1, -seconds(start_dt or end_dt, 0), e.lane or "zz", e.sub or "zz", e.title.lower())
        return (2, 10**15, e.lane or "zz", e.sub or "zz", e.title.lower())

    records.sort(key=table_sort_key)
    return records


def write_events(path: Path, events: List[EventRecord]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, lineterminator="\n")
        writer.writeheader()
        for e in events:
            row = asdict(e)
            writer.writerow({k: row.get(k, "") for k in CSV_COLUMNS})


def write_manifest(events: List[EventRecord], fresh: List[EventRecord]) -> None:
    latest = now_iso()
    payload = {
        "name": "NeatDuck_Timeline public event library",
        "source": SOURCE_URL,
        "updatedAt": latest,
        "totalEvents": len(events),
        "activeEvents": len(fresh),
        "schema": "events.csv/v1-compatible-with-extra-metadata",
        "coreColumns": CORE_COLUMNS,
        "extensionDefaultUrl": "https://yang-zhang-717.github.io/NeatDuck_Timeline/data/events.csv",
    }
    MANIFEST_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    SNAPSHOT_PATH.write_text(json.dumps([asdict(e) for e in fresh], ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    print(f"Fetching {SOURCE_URL}")
    fresh, _cache = scrape_events()
    existing = read_events(EVENTS_PATH)
    manual = read_events(MANUAL_PATH)
    merged = merge_library(existing, manual, fresh)
    write_events(EVENTS_PATH, merged)
    write_manifest(merged, fresh)
    print(f"Fresh events: {len(fresh)}")
    print(f"Historical library total: {len(merged)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
