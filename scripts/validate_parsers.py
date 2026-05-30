#!/usr/bin/env python3
from __future__ import annotations
import importlib.util, sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("update_data", root / "scripts" / "update_data.py")
mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mod
assert spec.loader is not None
spec.loader.exec_module(mod)

cases = [
    (
        "Memories in Motion",
        "Starts March 3, 2026 10:00 AM Local Time Ends June 2, 2026 10:00 AM Local Time",
        "2026-03-03T10:00:00",
        "2026-06-02T10:00:00",
    ),
    (
        "Copenhagen GO Fest",
        "Starts Calculating... Ends Calculating... Event Overview Dates: June 12-June 14, 2026 Time: 9:00 AM - 6:00 PM CEST",
        "2026-06-12T07:00:00Z",
        "2026-06-14T16:00:00Z",
    ),
    (
        "Generic Mega Raid Day",
        "Starts June 27, 2026 2:00 PM Local Time Ends June 27, 2026 5:00 PM Local Time Mega Raid Day",
        "2026-06-27T14:00:00",
        "2026-06-27T17:00:00",
    ),
]

for name, text, exp_s, exp_e in cases:
    s, e = mod.parse_detail_text_dates(text)
    got_s, got_e = mod.to_iso(s), mod.to_iso(e)
    assert got_s == exp_s, (name, got_s, exp_s)
    assert got_e == exp_e, (name, got_e, exp_e)
print("Python detail parser fixtures OK")
