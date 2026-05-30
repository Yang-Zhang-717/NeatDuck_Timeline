#!/usr/bin/env python3
from __future__ import annotations
import json, math
from pathlib import Path

CPM50 = 0.84029999

def cp(a: int, d: int, s: int, iva: int = 15, ivd: int = 15, ivs: int = 15, cpm: float = CPM50) -> int:
    return max(10, math.floor((a + iva) * math.sqrt(d + ivd) * math.sqrt(s + ivs) * cpm * cpm / 10))

root = Path(__file__).resolve().parents[1]
db = json.loads((root / "assets" / "pokemon.json").read_text(encoding="utf-8"))["pokedex"]

def find(name: str, form: str = "") -> dict:
    for r in db:
        if r.get("Name") == name and (not form or r.get("Form") == form):
            return r
    raise KeyError((name, form))

checks = [
    ("Black Kyurem", "Black Kyurem", (15,15,15), 5206),
    ("Zamazenta", "Crowned Shield", (13,15,15), 4681),
    ("Zamazenta", "Hero of Many Battles", (13,15,15), 4297),
    ("Ho-oh", "", (15,15,15), 4367),
    ("Metagross", "", (15,15,15), 4286),
    ("Kyogre", "", (15,15,15), 4652),
    ("Rhyperior", "", (15,15,15), 4221),
    ("Hydreigon", "", (15,15,15), 4098),
]
for name, form, ivs, expected in checks:
    r = find(name, form)
    got = cp(int(r["goAttack"]), int(r["goDefense"]), int(r["goStamina"]), *ivs)
    assert got == expected, (name, form, got, expected)
print("CP formula fixtures OK")
