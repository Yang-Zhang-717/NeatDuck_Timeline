#!/usr/bin/env python3
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'assets' / 'pokemon_go.json').read_text(encoding='utf-8'))
CPM = DATA['cpm']

def find(name, form=''):
    for row in DATA['rows']:
        if row['name'].lower() == name.lower() and (not form or row.get('form','').lower() == form.lower()):
            return row
    raise SystemExit(f'missing {name} {form}')

def cp(row, level=50, atk=15, defense=15, stamina=15):
    m = float(CPM[str(float(level)).rstrip('0').rstrip('.') if float(level).is_integer() else str(level)])
    return max(10, math.floor((row['goAttack']+atk) * math.sqrt(row['goDefense']+defense) * math.sqrt(row['goStamina']+stamina) * m*m / 10))

CASES = [
    ('Kyurem', 'White Kyurem', 50, 15, 15, 15, 5206),
    ('Kyurem', 'Black Kyurem', 50, 15, 15, 15, 5206),
    ('Zamazenta', 'Crowned Shield', 50, 13, 15, 15, 4681),
    ('Ho-oh', '', 50, 15, 15, 15, 4367),
    ('Metagross', '', 50, 15, 15, 15, 4286),
    ('Kyogre', '', 50, 15, 15, 15, 4652),
    ('Rhyperior', '', 50, 15, 15, 15, 4221),
    ('Hydreigon', '', 50, 15, 15, 15, 4098),
    ('Riolu', '', 50, 15, 15, 15, 1123),
    ('Corviknight', '', 50, 15, 15, 15, 2777),
]
for name, form, lvl, a, d, s, expected in CASES:
    row = find(name, form)
    got = cp(row, lvl, a, d, s)
    print(f'{row["displayName"]:<32} IV={a}/{d}/{s} Lv{lvl:<4} CP={got} expected={expected}')
    assert got == expected, (name, form, got, expected)
print('CP verification OK')
