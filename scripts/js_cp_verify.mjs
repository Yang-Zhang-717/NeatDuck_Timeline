import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'extension/assets/pokemon_go.json'), 'utf8'));
const CPM = DATA.cpm;
function find(name, form=''){
  const row = DATA.rows.find(r => r.name.toLowerCase() === name.toLowerCase() && (!form || String(r.form||'').toLowerCase() === form.toLowerCase()));
  if(!row) throw new Error(`missing ${name} ${form}`);
  return row;
}
function key(level){ const n=Number(level); return Number.isInteger(n) ? String(n) : String(n); }
function cp(row, level=50, atk=15, defense=15, stamina=15){
  const m = Number(CPM[key(level)] || CPM['50']);
  return Math.max(10, Math.floor((Number(row.goAttack)+atk) * Math.sqrt(Number(row.goDefense)+defense) * Math.sqrt(Number(row.goStamina)+stamina) * m*m / 10));
}
const cases = [
  ['Kyurem', 'White Kyurem', 50, 15, 15, 15, 5206],
  ['Kyurem', 'Black Kyurem', 50, 15, 15, 15, 5206],
  ['Zamazenta', 'Crowned Shield', 50, 13, 15, 15, 4681],
  ['Ho-oh', '', 50, 15, 15, 15, 4367],
  ['Metagross', '', 50, 15, 15, 15, 4286],
  ['Kyogre', '', 50, 15, 15, 15, 4652],
  ['Rhyperior', '', 50, 15, 15, 15, 4221],
  ['Hydreigon', '', 50, 15, 15, 15, 4098],
  ['Riolu', '', 50, 15, 15, 15, 1123],
  ['Corviknight', '', 50, 15, 15, 15, 2777],
];
for(const [name, form, level, a, d, s, expected] of cases){
  const row = find(name, form);
  const got = cp(row, level, a, d, s);
  console.log(`${row.displayName.padEnd(32)} IV=${a}/${d}/${s} Lv${String(level).padEnd(4)} CP=${got} expected=${expected}`);
  if(got !== expected) throw new Error(`${name} ${form}: got ${got}, expected ${expected}`);
}
console.log('JS CP verification OK');
