#!/usr/bin/env python3
"""Normalize a NeatDuck event CSV with the same compact output columns as the extension.
This is intentionally boring. Boring is how time-zone bugs are starved.
"""
from __future__ import annotations
import csv, json, sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import re

COLUMNS = ["title","shortTitle","category","lane","sub","start","endKnown","endInferred","href","timeZone","timeZoneLabel","isFixedTimeZone"]


def parse_date(value: str) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    # Extension CSV uses JSON-quoted fields. Input fixtures may be either raw or JSON-quoted.
    try:
        maybe = json.loads(value)
        if isinstance(maybe, str):
            value = maybe
    except Exception:
        pass
    if not value:
        return None
    v = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(v)
    except Exception:
        pass
    try:
        return parsedate_to_datetime(value)
    except Exception:
        return None


def iso_or_blank(value: str) -> str:
    d = parse_date(value)
    if not d:
        return ""
    if d.tzinfo is None:
        # JS Date parses bare local strings in local time; tests run with TZ=UTC for deterministic output.
        d = d.replace(tzinfo=timezone.utc)
    d = d.astimezone(timezone.utc).replace(microsecond=0)
    return d.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def normalize_href(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    p = urlsplit(value)
    path = p.path.rstrip("/")
    return urlunsplit((p.scheme, p.netloc, path, "", ""))


def clean_title(title: str, category: str) -> str:
    title = (title or "").strip()
    category = (category or "").strip()
    if category:
        title = re.sub(r"^(?:" + re.escape(category) + r")(?:\s+" + re.escape(category) + r")?\s+", "", title, flags=re.I)
    title = re.sub(r"\s{2,}", " ", title).strip()
    return title


def normalized_rows(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            if not (raw.get("title") or raw.get("href")):
                continue
            row = {k: (raw.get(k) or "") for k in COLUMNS}
            row["title"] = clean_title(row["title"], row["category"])
            row["href"] = normalize_href(row["href"])
            for k in ("start", "endKnown", "endInferred"):
                row[k] = iso_or_blank(row[k])
            row["timeZone"] = row["timeZone"] or "local"
            row["timeZoneLabel"] = row["timeZoneLabel"] or "Local Time"
            row["isFixedTimeZone"] = "1" if str(row["isFixedTimeZone"]).strip() else ""
            rows.append(row)
    return rows


def emit(rows: list[dict[str, str]]) -> str:
    out = [",".join(COLUMNS)]
    for r in rows:
        out.append(",".join(json.dumps(r.get(k, ""), ensure_ascii=False, separators=(",", ":")) for k in COLUMNS))
    return "\n".join(out)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python scripts/export_extension_csv.py <events.csv>", file=sys.stderr)
        return 2
    sys.stdout.write(emit(normalized_rows(Path(sys.argv[1]))))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
