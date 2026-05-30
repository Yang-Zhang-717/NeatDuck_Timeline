#!/usr/bin/env python3
import csv, math, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
CPM={50:0.84029999}
def cp(a,d,s,iva=15,ivd=15,ivs=15,level=50):
    m=CPM[level]
    return max(10, math.floor((a+iva)*math.sqrt(d+ivd)*math.sqrt(s+ivs)*m*m/10))
rows=list(csv.DictReader(open(ROOT/'data/pokemon.tsv',encoding='utf-8'), delimiter='\t'))
def find(num, form=''):
    for r in rows:
        if r['Number']==str(num) and r.get('Form','')==form: return r
    raise SystemExit(f'missing {num} {form}')
checks=[('White Kyurem',find(646,'White Kyurem'),15,15,15,5206),('Crowned Shield Zamazenta',find(889,'Crowned Shield'),13,15,15,4681),('Ho-Oh',find(250,''),15,15,15,4367),('Metagross',find(376,''),15,15,15,4286),('Kyogre',find(382,''),15,15,15,4652),('Rhyperior',find(464,''),15,15,15,4221),('Hydreigon',find(635,''),15,15,15,4098)]
for name,r,ia,idf,isv,expected in checks:
    got=cp(int(r['goAttack']),int(r['goDefense']),int(r['goStamina']),ia,idf,isv)
    print(f'{name}: {got} expected {expected}')
    assert got==expected, (name,got,expected,r)
print('CP validation OK')
