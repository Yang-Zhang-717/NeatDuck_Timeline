#!/usr/bin/env python3
import csv, json, sys
from pathlib import Path
COLUMNS=["uid","title","shortTitle","category","lane","sub","start","endKnown","endInferred","href","timeZone","timeZoneLabel","isFixedTimeZone","source","firstSeenAt","lastSeenAt","lastScrapedAt","status"]
rows=json.load(open(Path(__file__).with_name('csv_contract_events.json'),encoding='utf-8'))
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('python_events.csv')
out.parent.mkdir(parents=True, exist_ok=True)
with out.open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f, fieldnames=COLUMNS, lineterminator='\n')
    w.writeheader()
    for r in rows:
        w.writerow({c:r.get(c,'') for c in COLUMNS})
