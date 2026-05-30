#!/usr/bin/env node
const fs=require('fs'), vm=require('vm'), path=require('path');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'extension/core.js'),'utf8');
const sandbox={window:{},console,URL,Intl,Date,setTimeout,clearTimeout,btoa:(s)=>Buffer.from(s,'binary').toString('base64')};
vm.createContext(sandbox); vm.runInContext(code,sandbox);
const Core=sandbox.window.LDT_Core;
const raw=fs.readFileSync(path.join(root,'data/events.tsv'),'utf8');
const ev=Core.tsvToEvents(raw);
const out=Core.eventsToTSV(ev);
const ev2=Core.tsvToEvents(out);
if(ev.length!==ev2.length) throw new Error(`row mismatch ${ev.length} ${ev2.length}`);
for(let i=0;i<ev.length;i++){
  for(const k of ['title','lane','sub','href','timeZone','timeZoneLabel']){
    if(String(ev[i][k]||'')!==String(ev2[i][k]||'')) throw new Error(`field mismatch row ${i} ${k}`);
  }
}
console.log(`Node TSV roundtrip OK: ${ev.length} events`);
