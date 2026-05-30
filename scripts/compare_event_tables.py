#!/usr/bin/env python3
import csv, hashlib, pathlib, sys
root=pathlib.Path(__file__).resolve().parents[1]
path=root/'data/events.tsv'
raw=path.read_text(encoding='utf-8').replace('\r\n','\n').strip()+"\n"
rows=list(csv.reader(raw.splitlines(), delimiter='\t'))
assert len(rows)>1, 'events.tsv has no rows'
cols=rows[0]
required=['title','shortTitle','category','lane','sub','start','endKnown','endInferred','href','timeZone','timeZoneLabel','isFixedTimeZone','status','source']
assert cols==required, f'header mismatch: {cols}'
for i,row in enumerate(rows[1:], start=2):
    assert len(row)==len(cols), f'line {i}: expected {len(cols)} columns, got {len(row)}'
    assert row[0] and row[5], f'line {i}: title/start required'
print('Python TSV structural comparison OK:', len(rows)-1, 'events,', len(cols), 'columns')
print('SHA256', hashlib.sha256(raw.encode('utf-8')).hexdigest())
