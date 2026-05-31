#!/usr/bin/env python3
import html, zipfile, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'tmp_test'
TMP.mkdir(exist_ok=True)
rows=[['title','start','end','timeZone','isFixedTimeZone'],['Memories in Motion','2026-06-01T10:00:00','2026-06-03T20:00:00','local',''],['Copenhagen GO Fest','2026-06-13T00:00:00Z','2026-06-15T00:00:00Z','Europe/Copenhagen','1']]

def col(n):
    n+=1; out=''
    while n:
        n,rem=divmod(n-1,26); out=chr(65+rem)+out
    return out

def sheet_xml(rows):
    body=[]
    for r, row in enumerate(rows, 1):
        cells=[]
        for c, v in enumerate(row):
            cells.append(f'<c r="{col(c)}{r}" t="inlineStr"><is><t>{html.escape(str(v), quote=True)}</t></is></c>')
        body.append(f'<row r="{r}">{"".join(cells)}</row>')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + ''.join(body) + '</sheetData></worksheet>'

def write_xlsx(path, rows):
    files={
        '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="events" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        'xl/worksheets/sheet1.xml':sheet_xml(rows),
    }
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
        for k,v in files.items(): z.writestr(k, v.encode())

py_xlsx=TMP/'events_py.xlsx'
js_xlsx=TMP/'events_js.xlsx'
write_xlsx(py_xlsx, rows)
js_script=TMP/'make_excel.mjs'
js_script.write_text(f'''
import fs from 'node:fs';
global.window = globalThis;
await import('../extension/core.js');
const rows = {rows!r};
const blob = LDT_Core.rowsToXLSXBlob(rows, 'events');
const buf = Buffer.from(await blob.arrayBuffer());
fs.writeFileSync('{js_xlsx.as_posix()}', buf);
''', encoding='utf-8')
subprocess.run(['node', str(js_script)], cwd=ROOT, check=True)

def get_sheet(path):
    with zipfile.ZipFile(path) as z: return z.read('xl/worksheets/sheet1.xml')
assert get_sheet(py_xlsx)==get_sheet(js_xlsx), 'Python and JS sheet XML differ'
print('Excel parity OK:', py_xlsx, js_xlsx)
