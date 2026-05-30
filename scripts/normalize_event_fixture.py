#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import update_data

def csv_cell(value):
    if value is None:
        value = ""
    value = str(value)
    if any(ch in value for ch in [',','"','\n','\r']):
        return '"' + value.replace('"','""') + '"'
    return value

def iso_z(value):
    if not value:
        return ""
    return re.sub(r"\.\d{3}Z$", "Z", str(value))

inp, out = sys.argv[1], sys.argv[2]
rows=[]
for raw in json.loads(Path(inp).read_text(encoding='utf-8')):
    sub=raw.get('sub','')
    raw['shortTitle']=raw.get('shortTitle') or update_data.short_title(raw.get('title',''), raw.get('category',''), sub)
    raw['uid']=raw.get('uid','')
    raw['source']=raw.get('source','fixture')
    raw['isLocal']=raw.get('isLocal','1')
    raw['status']=raw.get('status','saved')
    for k in ('start','endKnown','endInferred'):
        raw[k]=iso_z(raw.get(k,''))
    rows.append(raw)
cols=update_data.CSV_COLUMNS
Path(out).write_text('\n'.join([','.join(cols)] + [','.join(csv_cell(r.get(c,'')) for c in cols) for r in rows]), encoding='utf-8')
