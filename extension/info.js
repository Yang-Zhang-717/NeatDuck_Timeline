// == info.js v1.0.7 ==
(function(){
  const Info = {
    extra:null,
    mode:null,
    opts:{},
    typeState:{attack:'fire', defenders:['grass']},
    pokedexQuery:'', pokedexGeneration:'all', pokedexCategory:'all', selectedPokemonId:null,
    cp:{atk:15, def:15, sta:15, level:40},
    maxQuery:''
  };

  const typeColors={normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'};
  const labels={
    'zh-CN':{types:'属性克制',pokedex:'宝可梦图鉴',max:'极巨化',attackView:'攻击视角',defenseView:'防御视角',attackType:'攻击属性',defenders:'被攻击属性',none:'无',multiplier:'伤害倍率',incoming:'防御视角',search:'搜索名称 / 编号 / 属性 / 中文',showing:'显示',rows:'行',source:'数据来自本地 Pokemon/Pokémon GO 资料表；GO 种族值缺省时按主系列种族值转换估算。',generation:'世代',category:'类别',all:'全部',mega:'可 Mega',dynamax:'可 Dynamax',gigantamax:'可 Gigantamax',legendary:'传说宝可梦',mythical:'幻之宝可梦',cpCalc:'CP / IV 计算',level:'等级',atkIV:'攻击 IV',defIV:'防御 IV',staIV:'体力 IV',goStats:'GO 种族值',formula:'公式',superEffective:'超级有效',effective:'有效',normal:'一般',resisted:'无效',superResisted:'超级无效',avgDmg:'平均伤害',maxSource:'极巨化表含 Max/G-Max 技能、平均伤害与补齐的 LV40/LV50 CP。'},
    'zh-TW':{types:'屬性克制',pokedex:'寶可夢圖鑑',max:'極巨化',attackView:'攻擊視角',defenseView:'防禦視角',attackType:'攻擊屬性',defenders:'被攻擊屬性',none:'無',multiplier:'傷害倍率',incoming:'防禦視角',search:'搜尋名稱 / 編號 / 屬性 / 中文',showing:'顯示',rows:'列',source:'資料來自本地 Pokemon/Pokémon GO 資料表；GO 種族值缺省時按主系列種族值轉換估算。',generation:'世代',category:'類別',all:'全部',mega:'可 Mega',dynamax:'可 Dynamax',gigantamax:'可 Gigantamax',legendary:'傳說寶可夢',mythical:'幻之寶可夢',cpCalc:'CP / IV 計算',level:'等級',atkIV:'攻擊 IV',defIV:'防禦 IV',staIV:'體力 IV',goStats:'GO 種族值',formula:'公式',superEffective:'超級有效',effective:'有效',normal:'一般',resisted:'無效',superResisted:'超級無效',avgDmg:'平均傷害',maxSource:'極巨化表含 Max/G-Max 技能、平均傷害與補齊的 LV40/LV50 CP。'},
    en:{types:'Type Chart',pokedex:'Pokédex',max:'Dynamax',attackView:'Attack view',defenseView:'Defense view',attackType:'Attack type',defenders:'Defender types',none:'None',multiplier:'Damage multiplier',incoming:'Defense view',search:'Search name / number / type / Chinese',showing:'Showing',rows:'rows',source:'Data comes from local Pokémon / Pokémon GO tables; missing GO stats are converted from main-series base stats.',generation:'Generation',category:'Category',all:'All',mega:'Mega-capable',dynamax:'Dynamax-capable',gigantamax:'Gigantamax-capable',legendary:'Legendary',mythical:'Mythical',cpCalc:'CP / IV calculator',level:'Level',atkIV:'Attack IV',defIV:'Defense IV',staIV:'Stamina IV',goStats:'GO base stats',formula:'Formula',superEffective:'Super effective',effective:'Effective',normal:'Neutral',resisted:'Resisted',superResisted:'Double resisted',avgDmg:'Avg damage',maxSource:'The Max table includes Max/G-Max moves, average damage, and completed LV40/LV50 CP.'}
  };
  const genFallback={1:'Gen 1 · 红/绿/蓝/皮卡丘 · Red/Green/Blue/Yellow',2:'Gen 2 · 金/银/水晶 · Gold/Silver/Crystal',3:'Gen 3 · 红宝石/蓝宝石/绿宝石/火红/叶绿 · Ruby/Sapphire/Emerald/FRLG',4:'Gen 4 · 钻石/珍珠/白金/心金/魂银 · Diamond/Pearl/Platinum/HGSS',5:'Gen 5 · 黑/白/黑2/白2 · Black/White/B2W2',6:'Gen 6 · X/Y/欧米伽红宝石/阿尔法蓝宝石',7:'Gen 7 · 太阳/月亮/究极日月/Let\'s Go',8:'Gen 8 · 剑/盾/BDSP/传说阿尔宙斯',9:'Gen 9 · 朱/紫 · Scarlet/Violet'};
  const CPM={1:0.094,1.5:0.135137432,2:0.16639787,2.5:0.192650919,3:0.21573247,3.5:0.236572661,4:0.25572005,4.5:0.273530381,5:0.29024988,5.5:0.306057377,6:0.3210876,6.5:0.335445036,7:0.34921268,7.5:0.362457751,8:0.37523559,8.5:0.387592406,9:0.39956728,9.5:0.411193551,10:0.42250001,10.5:0.432926419,11:0.44310755,11.5:0.4530599578,12:0.46279839,12.5:0.472336083,13:0.48168495,13.5:0.4908558,14:0.49985844,14.5:0.508701765,15:0.51739395,15.5:0.525942511,16:0.53435433,16.5:0.542635767,17:0.55079269,17.5:0.558830576,18:0.56675452,18.5:0.574569153,19:0.58227891,19.5:0.589887917,20:0.59740001,20.5:0.604823665,21:0.61215729,21.5:0.619404122,22:0.62656713,22.5:0.633649143,23:0.64065295,23.5:0.647580966,24:0.65443563,24.5:0.661219252,25:0.667934,25.5:0.674581896,26:0.68116492,26.5:0.687684904,27:0.69414365,27.5:0.70054287,28:0.70688421,28.5:0.713169109,29:0.71939909,29.5:0.725575614,30:0.7317,30.5:0.734741009,31:0.73776948,31.5:0.740785574,32:0.74378943,32.5:0.746781211,33:0.74976104,33.5:0.752729087,34:0.75568551,34.5:0.758630378,35:0.76156384,35.5:0.764486065,36:0.76739717,36.5:0.770297266,37:0.7731865,37.5:0.776064962,38:0.77893275,38.5:0.781790055,39:0.78463697,39.5:0.787473578,40:0.79030001,40.5:0.79280395,41:0.79530001,41.5:0.79780001,42:0.8003,42.5:0.802799995,43:0.8053,43.5:0.8078,44:0.81029999,44.5:0.812799985,45:0.81529999,45.5:0.81779999,46:0.82029999,46.5:0.82279999,47:0.82529999,47.5:0.82779999,48:0.83029999,48.5:0.83279999,49:0.83529999,49.5:0.83779999,50:0.84029999};

  function lang(){ return (Info.opts && Info.opts.getLang && Info.opts.getLang()) || (window.LDT_Core && LDT_Core.DEFAULT_LANG) || 'zh-CN'; }
  function t(k){ const l=lang(); return (labels[l]||labels.en)[k] || labels.en[k] || k; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function typeLabel(type){ const l=lang(); return type[l] || type['zh-CN'] || type.en || type.key; }
  function typeByKey(k){ return (Info.extra && Info.extra.types || []).find(x=>x.key===k); }
  function badge(k){ const ty=typeByKey(k); if(!ty) return ''; return `<span class="nd-type-badge" style="--nd-type-color:${typeColors[k]||'#889'}">${esc(typeLabel(ty))}</span>`; }
  function fmtMul(v){ if(!isFinite(v)) return ''; const x=Math.round(v*1000000)/1000000; return String(x).replace(/\.0$/,''); }
  function effClass(v){ if(v>=2.55) return 'nd-eff-super-high'; if(v>1.01) return 'nd-eff-high'; if(v<0.51) return 'nd-eff-immune'; if(v<0.99) return 'nd-eff-low'; return 'nd-eff-one'; }
  function mult(atk, d1, d2){ const m=Info.extra.typeChart; if(!atk||!d1) return null; return (m[atk]?.[d1]??1) * (d2 ? (m[atk]?.[d2]??1) : 1); }
  function dexNo(r){ return Number(String(r.Number||'').replace(/[^0-9]/g,'')) || 0; }
  function genFor(n){ if(n<=151) return 1; if(n<=251) return 2; if(n<=386) return 3; if(n<=493) return 4; if(n<=649) return 5; if(n<=721) return 6; if(n<=809) return 7; if(n<=905) return 8; return 9; }
  function asBool(v){ return v===true || String(v||'').toLowerCase()==='true' || String(v||'')==='1'; }
  function genLabels(){ return (Info.extra && Info.extra.meta && Info.extra.meta.generationLabels) || genFallback; }
  function normSearch(v){ return String(v||'').toLowerCase(); }
  function goStats(r){
    const directA=Number(r.goAttack||r['GO Attack']||r.go_atk), directD=Number(r.goDefense||r['GO Defense']||r.go_def), directS=Number(r.goStamina||r['GO Stamina']||r.go_sta);
    if(directA && directD && directS) return {atk:directA, def:directD, sta:directS, source:'GO'};
    const a=Number(r.Attack)||0, spa=Number(r['Sp.Attack'])||0, d=Number(r.Defense)||0, spd=Number(r['Sp.Defense'])||0, hp=Number(r.HP)||0, spe=Number(r.Speed)||75;
    const speedMod = 1 + (spe - 75) / 500;
    return {atk:Math.round(2*((Math.max(a,spa)*0.875)+(Math.min(a,spa)*0.125))*speedMod), def:Math.round(2*((Math.max(d,spd)*0.875)+(Math.min(d,spd)*0.125))*speedMod), sta:Math.max(1, Math.floor(hp*1.75+50)), source:'converted'};
  }
  function calcCP(r){ const st=goStats(r); const cpm=CPM[Number(Info.cp.level)] || CPM[40]; return Math.max(10, Math.floor((st.atk+Number(Info.cp.atk))*Math.sqrt(st.def+Number(Info.cp.def))*Math.sqrt(st.sta+Number(Info.cp.sta))*cpm*cpm/10)); }
  function radar(){ const vals=[Info.cp.atk,Info.cp.def,Info.cp.sta].map(v=>Number(v)/15); const cx=58, cy=52, R=42; const pts=vals.map((v,i)=>{ const ang=(-90+i*120)*Math.PI/180; return `${cx+Math.cos(ang)*R*v},${cy+Math.sin(ang)*R*v}`; }).join(' '); const grid=[1,.66,.33].map(g=>{ const ps=[0,1,2].map(i=>{const a=(-90+i*120)*Math.PI/180; return `${cx+Math.cos(a)*R*g},${cy+Math.sin(a)*R*g}`;}).join(' '); return `<polygon points="${ps}" class="nd-iv-grid"/>`; }).join(''); return `<svg class="nd-iv-radar" viewBox="0 0 116 104">${grid}<polygon points="${pts}" class="nd-iv-poly"/><text x="58" y="8">Atk</text><text x="12" y="96">Def</text><text x="88" y="96">HP</text></svg>`; }

  async function loadExtra(){
    if(Info.extra) return Info.extra;
    let url='assets/pokemon_extra.json';
    try{ if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.getURL) url=chrome.runtime.getURL(url); }catch(_){ }
    const res=await fetch(url); Info.extra=await res.json();
    Info.extra.pokedex=(Info.extra.pokedex||[]).map(r=>{ const n=dexNo(r); return {...r, generation:Number(r.generation||r.Generation||genFor(n)), isMega:asBool(r.isMega)||/mega/i.test(String(r.Form||r.Name||'')), canDynamax:asBool(r.canDynamax), canGigantamax:asBool(r.canGigantamax), isLegendary:asBool(r.isLegendary), isMythical:asBool(r.isMythical)}; });
    return Info.extra;
  }
  function ensureUI(){
    const right=document.getElementById('ld-right'); if(!right) return false;
    if(!document.getElementById('ld-info-panel')){ const panel=document.createElement('div'); panel.id='ld-info-panel'; panel.style.display='none'; right.appendChild(panel); }
    return true;
  }
  function hide(){ const p=document.getElementById('ld-info-panel'); if(p) p.style.display='none'; Info.mode=null; }
  function showOnlyPanel(){ const svg=document.getElementById('ld-timeline-svg'), mg=document.getElementById('ld-monthgrid'), p=document.getElementById('ld-info-panel'); if(svg) svg.style.display='none'; if(mg) mg.style.display='none'; if(p) p.style.display='block'; }
  Info.show=async function(mode){ if(!ensureUI()) return; Info.mode=mode; showOnlyPanel(); await loadExtra(); render(mode); };
  Info.hide=hide;
  Info.refreshLabels=function(){ ensureUI(); if(Info.mode) render(Info.mode); };

  function render(mode){ const p=document.getElementById('ld-info-panel'); if(!p) return; if(mode==='types') renderTypes(p); else if(mode==='pokedex') renderPokedex(p); else if(mode==='max') renderMax(p); }

  function defenderControls(){ const chosen=Info.typeState.defenders||[]; return (Info.extra.types||[]).map(ty=>`<button class="nd-type-pick ${chosen.includes(ty.key)?'is-picked':''}" data-pick-def="${esc(ty.key)}">${badge(ty.key)}</button>`).join(''); }
  function incomingGroups(){
    const [d1,d2]=Info.typeState.defenders; const groups={superEffective:[],effective:[],normal:[],resisted:[],superResisted:[]};
    for(const atk of Info.extra.types){ const v=mult(atk.key,d1,d2); const row={atk:atk.key,v}; if(v>=2.55) groups.superEffective.push(row); else if(v>1.01) groups.effective.push(row); else if(v<0.51) groups.superResisted.push(row); else if(v<0.99) groups.resisted.push(row); else groups.normal.push(row); }
    Object.values(groups).forEach(a=>a.sort((x,y)=>y.v-x.v || x.atk.localeCompare(y.atk)));
    return groups;
  }
  function renderTypes(panel){
    const st=Info.typeState, types=Info.extra.types, chart=Info.extra.typeChart, [d1,d2]=st.defenders;
    const selectedMult=mult(st.attack,d1,d2)||1;
    const header=types.map(ty=>`<th class="${d1===ty.key||d2===ty.key?'nd-selected-col':''}" data-pick-def="${esc(ty.key)}">${badge(ty.key)}</th>`).join('');
    const rows=types.map(at=>`<tr><th class="${st.attack===at.key?'nd-selected-row':''}" data-atk="${esc(at.key)}">${badge(at.key)}</th>${types.map(df=>{ const v=chart[at.key]?.[df.key]??1; const sel=(st.attack===at.key && (d1===df.key||d2===df.key)); return `<td class="${effClass(v)} ${sel?'nd-selected-cell':''}" data-atk="${esc(at.key)}" data-pick-def="${esc(df.key)}">${fmtMul(v)}</td>`; }).join('')}</tr>`).join('');
    const groups=incomingGroups();
    const block=(key)=>`<div class="nd-defense-bucket ${key}"><h4>${esc(t(key))}</h4>${groups[key].map(x=>`<span class="nd-incoming-chip ${effClass(x.v)}">${badge(x.atk)} <b>${fmtMul(x.v)}×</b></span>`).join('')||'<span class="nd-muted">-</span>'}</div>`;
    panel.innerHTML=`<div class="nd-info-layout nd-types-layout"><div class="nd-info-main"><h2>${esc(t('types'))}</h2><div class="nd-table-scroll"><table class="nd-type-chart"><thead><tr><th>ATK \\ DEF</th>${header}</tr></thead><tbody>${rows}</tbody></table></div></div><aside class="nd-info-side"><section class="nd-card"><h3>${esc(t('attackView'))}</h3><label>${esc(t('attackType'))}<select data-type-control="attack">${types.map(ty=>`<option value="${esc(ty.key)}" ${st.attack===ty.key?'selected':''}>${esc(typeLabel(ty))}</option>`).join('')}</select></label><div class="nd-defender-picks"><b>${esc(t('defenders'))}</b><div>${defenderControls()}</div></div><div class="nd-big-mult ${effClass(selectedMult)}">${fmtMul(selectedMult)}×</div><div>${badge(st.attack)} → ${badge(d1)} ${d2?badge(d2):''}</div></section><section class="nd-card"><h3>${esc(t('defenseView'))}</h3><div class="nd-defense-compact">${['superEffective','effective','normal','resisted','superResisted'].map(block).join('')}</div></section></aside></div>`;
    panel.querySelectorAll('[data-type-control="attack"]').forEach(sel=>sel.addEventListener('change',()=>{ st.attack=sel.value; renderTypes(panel); }));
    panel.querySelectorAll('[data-atk]').forEach(el=>el.addEventListener('click',()=>{ st.attack=el.getAttribute('data-atk'); renderTypes(panel); }));
    panel.querySelectorAll('[data-pick-def]').forEach(el=>el.addEventListener('click',ev=>{ ev.preventDefault(); const k=el.getAttribute('data-pick-def'); let arr=(Info.typeState.defenders||[]).filter(Boolean); arr=arr.filter(x=>x!==k); arr.push(k); if(arr.length>2) arr=arr.slice(arr.length-2); if(!arr.length) arr=[k]; Info.typeState.defenders=arr; renderTypes(panel); }));
  }

  function filterRows(){ const q=normSearch(Info.pokedexQuery.trim()); return Info.extra.pokedex.filter(r=>{ const text=normSearch([r.search,r.Number,r.Name,r['zh-CN'],r['zh-TW'],r.ja,r.Form,r['Type 1'],r['Type 2']].join(' ')); if(q && !text.includes(q)) return false; if(Info.pokedexGeneration!=='all' && String(r.generation)!==String(Info.pokedexGeneration)) return false; const cat=Info.pokedexCategory; if(cat==='mega' && !r.isMega) return false; if(cat==='dynamax' && !r.canDynamax) return false; if(cat==='gigantamax' && !r.canGigantamax) return false; if(cat==='legendary' && !r.isLegendary) return false; if(cat==='mythical' && !r.isMythical) return false; return true; }); }
  function renderPokedex(panel){
    const rows=filterRows(); const selected=Info.extra.pokedex.find(r=>String(r.Number)+'|'+String(r.Name)+'|'+String(r.Form||'')===Info.selectedPokemonId) || rows[0] || Info.extra.pokedex[0]; if(selected) Info.selectedPokemonId=String(selected.Number)+'|'+String(selected.Name)+'|'+String(selected.Form||'');
    const gLabels=genLabels();
    const stats=selected?goStats(selected):{atk:0,def:0,sta:0,source:''}; const cp=selected?calcCP(selected):0;
    panel.innerHTML=`<div class="nd-info-page nd-pokedex-page"><h2>${esc(t('pokedex'))}</h2><p class="nd-info-note">${esc(t('source'))}</p><div class="nd-filter-row"><input class="nd-info-search" data-info-search="pokedex" placeholder="${esc(t('search'))}" value="${esc(Info.pokedexQuery)}"><select class="btn" data-pokedex-filter="generation"><option value="all">${esc(t('all'))}</option>${Object.keys(gLabels).map(k=>`<option value="${k}" ${String(Info.pokedexGeneration)===String(k)?'selected':''}>${esc(gLabels[k])}</option>`).join('')}</select><select class="btn" data-pokedex-filter="category"><option value="all">${esc(t('all'))}</option>${['mega','dynamax','gigantamax','legendary','mythical'].map(k=>`<option value="${k}" ${Info.pokedexCategory===k?'selected':''}>${esc(t(k))}</option>`).join('')}</select></div><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.pokedex.length} ${esc(t('rows'))}</p><div class="nd-pokedex-grid"><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>#</th><th>Name</th><th>简中</th><th>繁中</th><th>日文</th><th>Form</th><th>Type</th><th>Gen</th><th>GO Atk</th><th>GO Def</th><th>GO Sta</th><th>Total</th></tr></thead><tbody>${rows.map(r=>{ const id=String(r.Number)+'|'+String(r.Name)+'|'+String(r.Form||''); const st=goStats(r); return `<tr data-pokemon-id="${esc(id)}" class="${id===Info.selectedPokemonId?'is-selected':''}"><td>${esc(r.Number)}</td><td>${esc(r.Name)}</td><td>${esc(r['zh-CN'])}</td><td>${esc(r['zh-TW'])}</td><td>${esc(r.ja)}</td><td>${esc(r.Form)}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r.generation)}</td><td>${st.atk}</td><td>${st.def}</td><td>${st.sta}</td><td>${esc(r.Total)}</td></tr>`; }).join('')}</tbody></table></div><aside class="nd-card nd-cp-card"><h3>${esc(t('cpCalc'))}</h3>${selected?`<b>#${esc(selected.Number)} ${esc(selected['zh-CN']||selected.Name)} ${selected.Form?`<span class="nd-muted">${esc(selected.Form)}</span>`:''}</b><div>${badge(selected.type1Key)}${selected.type2Key?badge(selected.type2Key):''}</div><p class="nd-info-note">${esc(t('goStats'))}: Atk ${stats.atk} / Def ${stats.def} / Sta ${stats.sta} <span class="nd-muted">${stats.source}</span></p><div class="nd-cp-result">CP ${cp}</div>${radar()}<label>${esc(t('level'))}<input data-cp="level" type="number" min="1" max="50" step="0.5" value="${Info.cp.level}"></label><label>${esc(t('atkIV'))}<input data-cp="atk" type="range" min="0" max="15" step="1" value="${Info.cp.atk}"><input data-cp="atk" type="number" min="0" max="15" value="${Info.cp.atk}"></label><label>${esc(t('defIV'))}<input data-cp="def" type="range" min="0" max="15" step="1" value="${Info.cp.def}"><input data-cp="def" type="number" min="0" max="15" value="${Info.cp.def}"></label><label>${esc(t('staIV'))}<input data-cp="sta" type="range" min="0" max="15" step="1" value="${Info.cp.sta}"><input data-cp="sta" type="number" min="0" max="15" value="${Info.cp.sta}"></label><details open><summary>${esc(t('formula'))}</summary><code>CP = floor((Atk+IVa) × sqrt(Def+IVd) × sqrt(Sta+IVs) × CPM(level)^2 / 10)</code><br><code>CP ≥ 10</code></details>`:''}</aside></div></div>`;
    const inp=panel.querySelector('[data-info-search="pokedex"]'); if(inp){ inp.addEventListener('input',()=>{ Info.pokedexQuery=inp.value; renderPokedex(panel); }); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    panel.querySelectorAll('[data-pokedex-filter]').forEach(sel=>sel.addEventListener('change',()=>{ if(sel.getAttribute('data-pokedex-filter')==='generation') Info.pokedexGeneration=sel.value; else Info.pokedexCategory=sel.value; renderPokedex(panel); }));
    panel.querySelectorAll('[data-pokemon-id]').forEach(tr=>tr.addEventListener('click',()=>{ Info.selectedPokemonId=tr.getAttribute('data-pokemon-id'); renderPokedex(panel); }));
    panel.querySelectorAll('[data-cp]').forEach(input=>input.addEventListener('input',()=>{ const k=input.getAttribute('data-cp'); let v=Number(input.value); if(k==='level') v=Math.max(1,Math.min(50,Math.round(v*2)/2)); else v=Math.max(0,Math.min(15,Math.round(v))); Info.cp[k]=v; renderPokedex(panel); }));
  }

  function renderMax(panel){
    const q=normSearch(Info.maxQuery.trim()); let rows=Info.extra.max.filter(r=>!q || normSearch(r.search||Object.values(r).join(' ')).includes(q));
    panel.innerHTML=`<div class="nd-info-page"><h2>${esc(t('max'))}</h2><p class="nd-info-note">${esc(t('maxSource'))}</p><input class="nd-info-search" data-info-search="max" placeholder="${esc(t('search'))}" value="${esc(Info.maxQuery)}"><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.max.length} ${esc(t('rows'))}</p><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>名称</th><th>LV40</th><th>LV50</th><th>坦度</th><th>属性</th><th>0.5s 小招</th><th>攻击</th><th>极巨技能</th><th>${esc(t('avgDmg'))}</th><th>超极巨技能</th><th>${esc(t('avgDmg'))}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r['名称'])}</td><td>${esc(r['LV40 CP'])}</td><td>${esc(r['LV50 CP'])}</td><td>${esc(r['坦度'])}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r['0.5s 小招'])}</td><td>${esc(r['攻击'])}</td><td>${esc([r['极巨技能1'],r['极巨技能2']].filter(Boolean).join(' / '))}</td><td>${esc([r['平1'],r['平2']].filter(Boolean).join(' / '))}</td><td>${esc(r['超极巨技能'])}</td><td>${esc(r['平3'])}</td></tr>`).join('')}</tbody></table></div></div>`;
    const inp=panel.querySelector('[data-info-search="max"]'); if(inp){ inp.addEventListener('input',()=>{ Info.maxQuery=inp.value; renderMax(panel); }); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
  Info.init=function(opts){ Info.opts=opts||{}; ensureUI(); };
  window.ND_Info=Info;
})();
