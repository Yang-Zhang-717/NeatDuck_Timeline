#!/usr/bin/env python3
"""
NeatDuck_Timeline public data updater.

v1.0.6 / data v1.7 fixes:
- Time-zone metadata is exported so browser extension and GitHub scraper agree.
- Detail-page text fallback for pages whose Starts/Ends widgets say "Calculating...".
- URL-based identity to remove duplicate rows, especially cards shown in both Happening Now and Upcoming.
- Extension-compatible lane/sub values so theme events do not disappear from the timeline.
- Stable table order: active/future first, historical rows below.
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
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
from dateutil import tz

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
CACHE_PATH = DATA_DIR / "detail_cache.json"
EVENTS_PATH = DATA_DIR / "events.csv"
MANUAL_PATH = DATA_DIR / "events.manual.csv"
MANIFEST_PATH = DATA_DIR / "manifest.json"
SNAPSHOT_PATH = DATA_DIR / "snapshot-latest.json"

SOURCE_URL = os.environ.get("LEEKDUCK_EVENTS_URL", "https://leekduck.com/events/")
REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "20"))
MAX_DETAIL_PAGES = int(os.environ.get("MAX_DETAIL_PAGES", "140"))
DETAIL_SLEEP_SECONDS = float(os.environ.get("DETAIL_SLEEP_SECONDS", "0.20"))

CSV_COLUMNS = [
    "uid", "source", "title", "shortTitle", "category", "lane", "sub", "overlay", "overlayTargetSub",
    "start", "endKnown", "endInferred", "href", "timeZone", "timeZoneLabel", "isFixedTimeZone",
    "isLocal", "status", "firstSeenAt", "lastSeenAt", "rawText",
]
CORE_COLUMNS = ["title", "shortTitle", "category", "lane", "sub", "start", "endKnown", "endInferred", "href"]

UA = (
    "NeatDuck_Timeline/1.0 (+https://github.com/Yang-Zhang-717/NeatDuck_Timeline; "
    "public schedule updater; contact via GitHub issues)"
)

TZINFOS = {
    "PT": tz.gettz("America/Los_Angeles"),
    "PDT": tz.gettz("America/Los_Angeles"),
    "PST": tz.gettz("America/Los_Angeles"),
    "JST": tz.gettz("Asia/Tokyo"),
    "CEST": tz.gettz("Europe/Copenhagen"),
    "CET": tz.gettz("Europe/Copenhagen"),
    "BST": tz.gettz("Europe/London"),
    "UTC": timezone.utc,
    "GMT": timezone.utc,
}

NAMED_TZ_RE = re.compile(r"\b(?:JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)\b", re.I)
TZ_CANONICAL = {
    "PT": "America/Los_Angeles",
    "PDT": "America/Los_Angeles",
    "PST": "America/Los_Angeles",
    "JST": "Asia/Tokyo",
    "CEST": "Europe/Copenhagen",
    "CET": "Europe/Copenhagen",
    "BST": "Europe/London",
    "UTC": "UTC",
    "GMT": "UTC",
}


def timezone_info(value: str) -> Dict[str, object]:
    text = value or ""
    m = NAMED_TZ_RE.search(text)
    if m:
        label = m.group(0).upper()
        return {
            "timeZone": TZ_CANONICAL.get(label, label),
            "timeZoneLabel": label,
            "isFixedTimeZone": True,
        }
    if re.search(r"\bLocal\s+Time\b", text, re.I):
        return {"timeZone": "local", "timeZoneLabel": "Local Time", "isFixedTimeZone": False}
    return {"timeZone": "local", "timeZoneLabel": "Local Time", "isFixedTimeZone": False}


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
    timeZone: str = "local"
    timeZoneLabel: str = "Local Time"
    isFixedTimeZone: str = ""
    isLocal: str = "1"
    uid: str = ""
    source: str = "leekduck"
    firstSeenAt: str = ""
    lastSeenAt: str = ""
    rawText: str = ""
    overlay: str = ""
    overlayTargetSub: str = ""
    lastScrapedAt: str = ""
    status: str = "active"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clean_text(value: str) -> str:
    value = html.unescape(value or "")
    value = value.replace("\u00a0", " ")
    value = value.replace("–", "-").replace("—", "-")
    value = value.replace("a.m.", "AM").replace("p.m.", "PM").replace("A.M.", "AM").replace("P.M.", "PM")
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
    # Strip query/fragment so the same detail page is one identity.
    return urlunparse((p.scheme, p.netloc, p.path.rstrip("/"), "", "", ""))


def has_named_tz(value: str) -> bool:
    return bool(NAMED_TZ_RE.search(value or ""))


def parse_dt(value: str, fallback_year: Optional[int] = None, inherited_tz: Optional[str] = None) -> Optional[datetime]:
    original = clean_text(value or "")
    if not original or original.lower().startswith("calculating"):
        return None

    is_floating_local = bool(re.search(r"\bLocal\s+Time\b", original, re.I))
    explicit_tz = (NAMED_TZ_RE.search(original) or None)
    tz_name = explicit_tz.group(0) if explicit_tz else (inherited_tz if inherited_tz and not is_floating_local else None)

    value = re.sub(r"\bLocal\s+Time\b", "", original, flags=re.I)
    if tz_name and not explicit_tz:
        value = f"{value} {tz_name}"
    value = value.replace(", at", " ").replace(" at ", " ")
    value = re.sub(r"\s+", " ", value).strip(" .")
    if not value:
        return None

    # dateutil uses default year/month/day for missing parts. Use Jan 1 of fallback/current year.
    base_year = fallback_year or datetime.now().year
    default = datetime.now().replace(year=base_year, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    try:
        dt = dateparser.parse(value, fuzzy=True, default=default, tzinfos=TZINFOS)
    except Exception:
        return None
    if not dt:
        return None
    dt = dt.replace(microsecond=0)

    if not tz_name or is_floating_local:
        dt = dt.replace(tzinfo=None)

    # If the year was omitted and the parsed date is implausibly old, roll forward.
    if not re.search(r"\b20\d{2}\b", value) and not fallback_year:
        today = datetime.now(dt.tzinfo).replace(microsecond=0) if dt.tzinfo else datetime.now().replace(tzinfo=None, microsecond=0)
        if dt < today - timedelta(days=45):
            try:
                dt = dt.replace(year=dt.year + 1)
            except ValueError:
                pass
    return dt


def to_iso(dt: Optional[datetime]) -> str:
    if not dt:
        return ""
    dt = dt.replace(microsecond=0)
    if dt.tzinfo:
        return dt.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return dt.isoformat(timespec="seconds")


def from_iso(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = dateparser.parse(value.replace("Z", "+00:00"), tzinfos=TZINFOS)
        if not dt:
            return None
        dt = dt.replace(microsecond=0)
        if dt.tzinfo:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
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
    if "max monday" in hay or "dynamax" in hay or "gigantamax" in hay:
        return "weekly", "Max Mondays"
    if "spotlight" in hay:
        return "weekly", "Pokémon Spotlight Hour"
    if "raid hour" in hay:
        return "weekly", "Raid Hour"
    if "pokestop showcase" in hay or "pokéstop showcase" in hay:
        return "weekly", "PokéStop Showcase"
    if "go battle league" in hay or re.search(r"\bgbl\b", hay):
        return "gbl", "GO Battle League"
    if "go pass" in hay:
        return "go-pass", "GO Pass"
    if "season" in hay:
        return "season", "Season"
    if "community day" in hay:
        return "community", "Community Day"
    if "city safari" in hay:
        return "city", "City Safari"
    if "shadow" in hay and "raid" in hay:
        return "raids", "Shadow Raid Battles"
    if "mega" in hay and "raid" in hay:
        return "raids", "Mega Raid Battles"
    if "raid" in hay:
        return "raids", "5-Star Raid Battles"
    if "go fest" in hay or "go tour" in hay or "wild area" in hay:
        return "theme", "Theme Main"
    return "theme", "Theme Event A"


def pokemonish_title_part(title: str) -> str:
    text = clean_text(title)
    patterns = [
        r"(.+?)\s+in\s+(?:Mega|5-star|5-Star|Shadow)\s+Raids?",
        r"(.+?)\s+in\s+5-star\s+Raid\s+Battles?",
        r"(?:Dynamax|Gigantamax)\s+(.+?)\s+during\s+Max\s+Monday",
        r"(.+?)\s+Raid\s+Hour",
        r"(.+?)\s+Spotlight\s+Hour",
        r"(.+?)\s+Community\s+Day",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if m:
            return clean_text(m.group(1))
    return text


def short_title(title: str, category: str, sub: str) -> str:
    title = clean_text(title)
    sub_l = (sub or "").lower()
    if "max monday" in sub_l:
        name = pokemonish_title_part(title)
        return name if name.lower().startswith("max ") else f"Max {name}"
    if "mega raid" in sub_l:
        name = pokemonish_title_part(title)
        if not name or re.search(r"^mega\s+raid\s+(day|weekend)$", name, re.I):
            return title
        return name if re.match(r"^(Mega|超级|超級)\b", name, re.I) else f"Mega {name}"
    if "raid" in sub_l:
        return pokemonish_title_part(title)
    if "battle league" in sub_l:
        return re.sub(r"^GO Battle League\s*", "", title, flags=re.I).strip() or title
    return title


def uid_for(e: EventRecord) -> str:
    href = safe_url(e.href)
    if href:
        key = "href:" + href.lower()
    else:
        key = "|".join([clean_text(e.title).lower(), clean_text(e.category).lower(), e.start[:10] if e.start else ""])
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def load_cache() -> Dict[str, dict]:
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_cache(cache: Dict[str, dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def fetch_html(url: str) -> str:
    r = requests.get(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"}, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    return r.text


def inherited_tz(*parts: str) -> Optional[str]:
    m = NAMED_TZ_RE.search(" ".join(p or "" for p in parts))
    return m.group(0) if m else None


def year_of(*parts: str) -> Optional[int]:
    m = re.search(r"\b(20\d{2})\b", " ".join(p or "" for p in parts))
    return int(m.group(1)) if m else None


def parse_detail_text_dates(raw: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    text = clean_text(raw)
    if not text:
        return None, None

    # "Dates: May 29-June 1, 2026 Time: 10:00 AM - 8:00 PM JST"
    # This must run before the generic "from ... to ..." matcher, or bonus-hour text can steal the event range.
    m = re.search(
        r"Dates:\s*([A-Za-z]+\s+\d{1,2})\s*-\s*([A-Za-z]+\s+\d{1,2}),?\s*(20\d{2})"
        r"(?:\s+Time:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)?)?",
        text,
        re.I,
    )
    if m:
        y = int(m.group(3))
        tz_name = m.group(6) or None
        start_phrase = f"{m.group(1)}, {y} {m.group(4) or '12:00 AM'}"
        end_phrase = f"{m.group(2)}, {y} {m.group(5) or '11:59 PM'}"
        start = parse_dt(start_phrase, y, tz_name)
        end = parse_dt(end_phrase, y, tz_name)
        if start or end:
            return start, end

    # "will run from March 24, 2026, at 1:00 PM to March 31, 2026, at 1:00 PM PT"
    m = re.search(r"(?:will\s+run\s+)?from\s+(.+?)\s+to\s+(.+?)(?:\.| Trainers\b|$)", text, re.I)
    if m:
        has_real_date = re.search(r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b", m.group(1) + " " + m.group(2), re.I)
        if has_real_date:
            tz_name = inherited_tz(m.group(1), m.group(2))
            y = year_of(m.group(1), m.group(2))
            start = parse_dt(m.group(1), y, tz_name)
            end = parse_dt(m.group(2), y or (start.year if start else None), tz_name)
            if start or end:
                return start, end

    # "on Saturday, May 30, at 6:00 PM PDT until Sunday, May 31, at 6:00 PM PDT"
    m = re.search(r"\bon\s+(.+?)\s+until\s+(.+?)(?:\.|$)", text, re.I)
    if m:
        tz_name = inherited_tz(m.group(1), m.group(2))
        y = year_of(text)
        start = parse_dt(m.group(1), y, tz_name)
        end = parse_dt(m.group(2), y or (start.year if start else None), tz_name)
        if start or end:
            return start, end

    return None, None


def detail_dates(href: str, cache: Dict[str, dict]) -> Tuple[Optional[datetime], Optional[datetime], Dict[str, object]]:
    href = safe_url(href)
    default_tz = timezone_info("")
    if not href:
        return None, None, default_tz
    cached = cache.get(href)
    if cached and (cached.get("start") or cached.get("end")):
        try:
            cached_at = dateparser.parse(cached.get("cachedAt", ""))
        except Exception:
            cached_at = None
        if cached_at and (datetime.now(timezone.utc) - cached_at.astimezone(timezone.utc)) < timedelta(hours=36):
            start, end = from_iso(cached.get("start", "")), from_iso(cached.get("end", ""))
            tz_meta = {
                "timeZone": cached.get("timeZone") or "local",
                "timeZoneLabel": cached.get("timeZoneLabel") or "Local Time",
                "isFixedTimeZone": bool(cached.get("isFixedTimeZone")),
            }
            if not start or not end or end >= start:
                return start, end, tz_meta

    html_text = fetch_html(href)
    soup = BeautifulSoup(html_text, "html.parser")
    raw_text = soup.get_text("\n")
    tz_meta = timezone_info(raw_text)

    def pick(section_id: str) -> Optional[datetime]:
        sec = soup.select_one(f"#{section_id}")
        if not sec:
            return None
        date_el = sec.select_one("span[data-event-page-date], span[data-event-page-data]")
        time_el = sec.select_one("span[data-event-page-time]")
        date_txt = date_el.get("data-event-page-date") or date_el.get("data-event-page-data") or date_el.get_text(" ") if date_el else ""
        time_txt = time_el.get("data-event-page-time") or time_el.get_text(" ") if time_el else ""
        return parse_dt(f"{date_txt} {time_txt}")

    start = pick("start-text")
    end = pick("end-text")
    if not start or not end:
        guessed_start, guessed_end = parse_detail_text_dates(raw_text)
        start = start or guessed_start
        end = end or guessed_end
    if start and end and end < start:
        try:
            fixed = end.replace(year=start.year + 1)
            if fixed > start:
                end = fixed
        except ValueError:
            pass
    cache[href] = {
        "start": to_iso(start),
        "end": to_iso(end),
        "timeZone": tz_meta.get("timeZone") or "local",
        "timeZoneLabel": tz_meta.get("timeZoneLabel") or "Local Time",
        "isFixedTimeZone": bool(tz_meta.get("isFixedTimeZone")),
        "cachedAt": now_iso(),
    }
    return start, end, tz_meta


def probable_cards(soup: BeautifulSoup) -> List:
    selectors = ["span.event-header-item-wrapper", "article", ".event-card", ".events-list .event", "a[href*='/events/']"]
    seen = set()
    cards = []
    for sel in selectors:
        for node in soup.select(sel):
            href_el = node if node.name == "a" else node.select_one("a[href]")
            href = safe_url(href_el.get("href") if href_el else "")
            if not href or href.rstrip("/") == SOURCE_URL.rstrip("/"):
                continue
            if "/events/" not in urlparse(href).path:
                continue
            key = href + "|" + clean_text(node.get_text(" "))[:80]
            if key in seen:
                continue
            seen.add(key)
            text = clean_text(node.get_text(" "))
            if len(text) >= 8:
                cards.append(node)
    return cards


def extract_title_category(card) -> Tuple[str, str]:
    title_el = card.select_one("h2,h3,.event-title") if hasattr(card, "select_one") else None
    title = clean_text(title_el.get_text(" ") if title_el else "")
    cat_el = card.select_one("p.badge,.badge,.label,.category,.event-type,.event-item-wrapper > p,p") if hasattr(card, "select_one") else None
    category = clean_text(cat_el.get_text(" ") if cat_el else "")
    text = clean_text(card.get_text(" "))
    if not title:
        m = DATE_RE.search(text)
        before_date = text[:m.start()].strip() if m else text
        tokens = before_date.split()
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
            raw = time_el.get("data-event-start-date-check") or time_el.get("data-event-start-date") or time_el.get("datetime") or time_el.get("data-event-list-date") or ""
            card_date = parse_dt(raw)
            explicit_end = parse_dt(time_el.get("data-event-end-date") or "")
            if section_hint == "happening":
                end = explicit_end or card_date
            else:
                start = card_date
                end = explicit_end
    text = clean_text(card.get_text(" "))
    date_match = DATE_RE.search(text)
    if date_match:
        dt = parse_dt(date_match.group(0))
        if section_hint == "happening" and not end:
            end = dt
        elif not start:
            start = dt
    return start, end


def detect_section(card) -> str:
    node = card
    for _ in range(7):
        prev = node.find_previous(["h1", "h2", "h3", "h4", "h5"])
        if not prev:
            break
        txt = clean_text(prev.get_text(" ")).lower()
        if "upcoming" in txt or "starts" in txt:
            return "upcoming"
        if "happening" in txt or "live now" in txt or "ends" in txt:
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
        card_tz = timezone_info(card.get_text(" "))
        detail_tz = card_tz

        if detail_fetches < MAX_DETAIL_PAGES:
            try:
                ds, de, detail_tz = detail_dates(href, cache)
                detail_fetches += 1
                if ds:
                    start_dt = ds
                if de:
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
            timeZone=str(detail_tz.get("timeZone") or card_tz.get("timeZone") or "local"),
            timeZoneLabel=str(detail_tz.get("timeZoneLabel") or card_tz.get("timeZoneLabel") or "Local Time"),
            isFixedTimeZone="1" if (detail_tz.get("isFixedTimeZone") or card_tz.get("isFixedTimeZone")) else "",
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
            if v and k in {"title", "shortTitle", "category", "lane", "sub", "start", "endKnown", "endInferred", "href", "timeZone", "timeZoneLabel", "isFixedTimeZone", "lastScrapedAt", "status"}:
                setattr(prev, k, v)
            elif v and not getattr(prev, k, ""):
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
            rec.lane, rec.sub = choose_lane_sub(rec.title, rec.category) if not rec.lane or not rec.sub or rec.sub in {"Event", "Update", "Pokémon GO Fest"} else (rec.lane, rec.sub)
            if not rec.shortTitle:
                rec.shortTitle = short_title(rec.title, rec.category, rec.sub)
            rec.timeZone = rec.timeZone or "local"
            rec.timeZoneLabel = rec.timeZoneLabel or ("Fixed Time" if rec.isFixedTimeZone else "Local Time")
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
        for field in ["title", "shortTitle", "category", "lane", "sub", "start", "endKnown", "endInferred", "href", "timeZone", "timeZoneLabel", "isFixedTimeZone"]:
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
        if not e.status or e.status == "active":
            e.status = "archived"
        put(e, active=False)
    for e in manual:
        e.source = "manual"
        e.status = e.status or "manual"
        put(e, active=False, manual_source=True)
    for e in fresh:
        put(e, active=True)

    records = list(by_uid.values())
    now_local = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)

    def event_start(e: EventRecord) -> Optional[datetime]:
        return from_iso(e.start)

    def event_end(e: EventRecord) -> Optional[datetime]:
        return from_iso(e.endKnown) or from_iso(e.endInferred) or event_start(e)

    def seconds(dt: Optional[datetime], fallback: float = 0.0) -> float:
        return dt.timestamp() if dt else fallback

    def table_sort_key(e: EventRecord):
        start_dt = event_start(e)
        end_dt = event_end(e)
        if start_dt or end_dt:
            if (end_dt and end_dt >= now_local) or (start_dt and start_dt >= now_local):
                return (0, seconds(start_dt or end_dt, 10**15), e.lane or "zz", e.sub or "zz", e.title.lower())
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
        "schema": "events.csv/v1.0.7-canonical-timezone",
        "coreColumns": CORE_COLUMNS,
        "extensionDefaultUrl": "https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.csv",
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
