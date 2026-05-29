#!/usr/bin/env python3
"""Normalize and publish the public NeatDuck_Timeline CSV.

The script is deliberately boring: it validates columns, dedupes by id/title/start,
sorts rows, and writes data/events.csv plus data/manifest.json. If SOURCE_CSV_URL is
set, it pulls from that URL; otherwise it uses data/events.manual.csv.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "events.csv"
MANUAL = DATA / "events.manual.csv"
MANIFEST = DATA / "manifest.json"
FIELDS = [
    "id", "title", "shortTitle", "category", "lane", "sub", "overlay",
    "overlayTargetSub", "rawText", "href", "start", "endKnown", "endInferred",
    "isLocal", "firstSeenAt", "lastSeenAt", "status",
]


def read_text() -> str:
    source_url = os.environ.get("SOURCE_CSV_URL", "").strip()
    if source_url:
        req = Request(source_url, headers={"User-Agent": "NeatDuck_Timeline updater"})
        with urlopen(req, timeout=30) as resp:
            text = resp.read(2_000_000).decode("utf-8-sig")
        return text
    return MANUAL.read_text(encoding="utf-8-sig") if MANUAL.exists() else OUT.read_text(encoding="utf-8-sig")


def stable_id(row: dict[str, str]) -> str:
    if row.get("id"):
        return row["id"].strip()
    key = "|".join((row.get(k, "") or "").strip().lower() for k in ["href", "title", "start", "sub"])
    return "evt_" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def normalize_rows(text: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise SystemExit("CSV has no header")
    lower = {name.lower(): name for name in reader.fieldnames}
    if "title" not in lower or "start" not in lower:
        raise SystemExit("CSV must include at least title and start columns")
    rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for raw in reader:
        row = {field: (raw.get(field) or raw.get(lower.get(field.lower(), ""), "") or "").strip() for field in FIELDS}
        if not row["title"] or not row["start"]:
            continue
        row["id"] = stable_id(row)
        if row["id"] in seen:
            continue
        seen.add(row["id"])
        if not row["status"]:
            row["status"] = "published"
        rows.append(row)
    rows.sort(key=lambda r: (r.get("start", ""), r.get("lane", ""), r.get("sub", ""), r.get("title", "")))
    return rows


def write_csv(rows: list[dict[str, str]]) -> None:
    DATA.mkdir(exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    manifest = {
        "project": "NeatDuck_Timeline",
        "version": 1,
        "events_csv": "data/events.csv",
        "row_count": len(rows),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    rows = normalize_rows(read_text())
    write_csv(rows)
    print(f"wrote {len(rows)} rows to {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
