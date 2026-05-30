// == info.js v1.0.7 ==
(function(){
  const Info = {
    extra:null,
    mode:null,
    opts:null,
    typeState:{attack:'fire', defenders:['grass']},
    pokedexQuery:'',
    pokedexGen:'all',
    pokedexCategory:'all',
    selectedPokemonKey:null,
    cp:{level:40, atkIV:15, defIV:15, hpIV:15},
    maxQuery:''
  };

  const typeColors={normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'};
  const labels={
    'zh-CN':{
      types:'属性克制',pokedex:'宝可梦图鉴',max:'极巨化',attackView:'攻击视角',defenseView:'防御视角',attackType:'攻击属性',defenderCombo:'被攻击属性组合',defenderHint:'按点击顺序最多选择两个，不能重复。',none:'无',multiplier:'伤害倍率',incoming:'防御视角',superEffective:'超级有效',effective:'有效',neutral:'一般',resisted:'无效',doubleResisted:'超级无效',
      search:'搜索名称 / 编号 / 属性 / 形态',generation:'世代',category:'类别',all:'全部',mega:'可 Mega',dynamax:'可 Dynamax',gigantamax:'可 Gigantamax',legendary:'传说宝可梦',mythical:'幻之宝可梦',showing:'显示',rows:'行',source:'数据表已补充世代、版本、GO 种族值、CP 与筛选字段。',
      calcTitle:'CP / IV 计算器',level:'等级',atkIV:'攻击 IV',defIV:'防御 IV',hpIV:'HP IV',baseStats:'GO 种族值',effectiveStats:'等级修正后数值',formula:'计算公式',selectPokemon:'点击表格行选择宝可梦。',
      maxNote:'极巨招式威力：Dynamax Max Attack Lv1/2/3 = 250/300/350；Gigantamax G-Max Lv1/2/3 = 350/400/450。表格评分使用 GO攻击 × 威力 / 1000；加入 IV 与等级修正时可用 (GO攻击 + 攻击IV) × CPM × 威力 / 100。',
      dmaxScore:'DMAX 评分',gmaxScore:'GMAX 评分',moves:'技能',bulk:'坦度'
    },
    'zh-TW':{
      types:'屬性克制',pokedex:'寶可夢圖鑑',max:'極巨化',attackView:'攻擊視角',defenseView:'防禦視角',attackType:'攻擊屬性',defenderCombo:'被攻擊屬性組合',defenderHint:'依點擊順序最多選兩個，不能重複。',none:'無',multiplier:'傷害倍率',incoming:'防禦視角',superEffective:'超級有效',effective:'有效',neutral:'一般',resisted:'無效',doubleResisted:'超級無效',
      search:'搜尋名稱 / 編號 / 屬性 / 型態',generation:'世代',category:'類別',all:'全部',mega:'可 Mega',dynamax:'可 Dynamax',gigantamax:'可 Gigantamax',legendary:'傳說寶可夢',mythical:'幻之寶可夢',showing:'顯示',rows:'列',source:'資料表已補齊世代、版本、GO 種族值、CP 與篩選欄位。',
      calcTitle:'CP / IV 計算器',level:'等級',atkIV:'攻擊 IV',defIV:'防禦 IV',hpIV:'HP IV',baseStats:'GO 種族值',effectiveStats:'等級修正後數值',formula:'計算公式',selectPokemon:'點擊表格列選擇寶可夢。',
      maxNote:'極巨招式威力：Dynamax Max Attack Lv1/2/3 = 250/300/350；Gigantamax G-Max Lv1/2/3 = 350/400/450。表格評分使用 GO攻擊 × 威力 / 1000；加入 IV 與等級修正時可用 (GO攻擊 + 攻擊IV) × CPM × 威力 / 100。',
      dmaxScore:'DMAX 評分',gmaxScore:'GMAX 評分',moves:'技能',bulk:'坦度'
    },
    en:{
      types:'Type Chart',pokedex:'Pokédex',max:'Dynamax',attackView:'Attack view',defenseView:'Defense view',attackType:'Attack type',defenderCombo:'Defender type combo',defenderHint:'Pick up to two defender types in click order. Duplicates are blocked.',none:'None',multiplier:'Damage multiplier',incoming:'Defense view',superEffective:'Super effective',effective:'Effective',neutral:'Neutral',resisted:'Resisted',doubleResisted:'Double resisted',
      search:'Search name / number / type / form',generation:'Generation',category:'Category',all:'All',mega:'Mega-capable',dynamax:'Dynamax-capable',gigantamax:'Gigantamax-capable',legendary:'Legendary',mythical:'Mythical',showing:'Showing',rows:'rows',source:'The data now includes generation, versions, GO stats, CP, and filter fields.',
      calcTitle:'CP / IV Calculator',level:'Level',atkIV:'Attack IV',defIV:'Defense IV',hpIV:'HP IV',baseStats:'GO base stats',effectiveStats:'Level-adjusted stats',formula:'Formula',selectPokemon:'Click a table row to select a Pokémon.',
      maxNote:'Max move power: Dynamax Max Attack Lv1/2/3 = 250/300/350; Gigantamax G-Max Lv1/2/3 = 350/400/450. Table score uses GO Attack × Power / 1000; with IV and level correction use (GO Attack + Attack IV) × CPM × Power / 100.',
      dmaxScore:'DMAX score',gmaxScore:'GMAX score',moves:'Moves',bulk:'Bulk'
    }
  };

  const CPM={
    1:0.094,1.5:0.135137432,2:0.16639787,2.5:0.192650919,3:0.21573247,3.5:0.236572661,4:0.25572005,4.5:0.273530381,5:0.29024988,5.5:0.306057377,6:0.3210876,6.5:0.335445036,7:0.34921268,7.5:0.362457751,8:0.37523559,8.5:0.387592406,9:0.39956728,9.5:0.411193551,10:0.42250001,10.5:0.432926419,11:0.44310755,11.5:0.453059958,12:0.46279839,12.5:0.472336083,13:0.48168495,13.5:0.4908558,14:0.49985844,14.5:0.508701765,15:0.51739395,15.5:0.525942511,16:0.53435433,16.5:0.542635767,17:0.55079269,17.5:0.558830586,18:0.56675452,18.5:0.574569153,19:0.58227891,19.5:0.589887917,20:0.59740001,20.5:0.604823657,21:0.61215729,21.5:0.619404122,22:0.62656713,22.5:0.633649143,23:0.64065295,23.5:0.647580966,24:0.65443563,24.5:0.661219252,25:0.667934,25.5:0.674581896,26:0.68116492,26.5:0.687684904,27:0.69414365,27.5:0.700542901,28:0.70688421,28.5:0.713169109,29:0.71939909,29.5:0.725575614,30:0.7317,30.5:0.734741009,31:0.73776948,31.5:0.740785574,32:0.74378943,32.5:0.746781211,33:0.74976104,33.5:0.752729087,34:0.75568551,34.5:0.758630378,35:0.76156384,35.5:0.764486065,36:0.76739717,36.5:0.770297266,37:0.7731865,37.5:0.776064962,38:0.77893275,38.5:0.781790055,39:0.78463697,39.5:0.787473578,40:0.79030001,40.5:0.79280395,41:0.79530001,41.5:0.7978039,42:0.8003,42.5:0.8028039,43:0.8053,43.5:0.8078039,44:0.81029999,44.5:0.8128039,45:0.81529999,45.5:0.8178039,46:0.82029999,46.5:0.8228039,47:0.82529999,47.5:0.8278039,48:0.83029999,48.5:0.8328039,49:0.83529999,49.5:0.8378039,50:0.84029999
  };

  function lang(){ return (Info.opts && Info.opts.getLang && Info.opts.getLang()) || (window.LDT_Core && LDT_Core.DEFAULT_LANG) || 'zh-CN'; }
  function t(k){ const l=lang(); return (labels[l]||labels.en)[k] || labels.en[k] || k; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function norm(v){ return String(v==null?'':v).normalize('NFKC').toLocaleLowerCase(); }
  function num(v, fallback=0){ const n=Number(v); return Number.isFinite(n)?n:fallback; }
  function typeLabel(type){ const l=lang(); return type[l] || type['zh-CN'] || type.en || type.key; }
  function typeByKey(k){ return (Info.extra && Info.extra.types || []).find(x=>x.key===k); }
  function badge(k){ const ty=typeByKey(k); if(!ty) return ''; return `<span class="nd-type-badge" style="--nd-type-color:${typeColors[k]||'#889'}">${esc(typeLabel(ty))}</span>`; }
  function fmtMul(v){ if(!Number.isFinite(v)) return ''; const x=Math.round(v*1000000)/1000000; return String(x).replace(/\.0$/,''); }
  function effClass(v){ if(v>=2.55) return 'nd-eff-double-high'; if(v>1.01) return 'nd-eff-high'; if(v<=0.40) return 'nd-eff-immune'; if(v<0.99) return 'nd-eff-low'; return 'nd-eff-one'; }
  function effBucket(v){ if(v>=2.55) return 'superEffective'; if(v>1.01) return 'effective'; if(v<=0.40) return 'doubleResisted'; if(v<0.99) return 'resisted'; return 'neutral'; }
  function pokemonKey(r){ return `${r.Number||''}|${r.Name||''}|${r.Form||''}`; }
  function bestName(r){ const l=lang(); return (l==='en' ? r.Name : (r[l]||r['zh-CN']||r.Name)) || r.Name || ''; }

  async function loadExtra(){
    if(Info.extra) return Info.extra;
    let url='assets/pokemon_extra.json';
    try{ if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.getURL) url=chrome.runtime.getURL(url); }catch(_){ }
    const res=await fetch(url); Info.extra=await res.json(); return Info.extra;
  }

  function ensureUI(){
    const right=document.getElementById('ld-right'); if(!right) return false;
    if(!document.getElementById('ld-info-panel')){
      const panel=document.createElement('div'); panel.id='ld-info-panel'; panel.style.display='none'; right.appendChild(panel);
    }
    return true;
  }
  function hide(){ const p=document.getElementById('ld-info-panel'); if(p) p.style.display='none'; Info.mode=null; }
  function showOnlyPanel(){
    const svg=document.getElementById('ld-timeline-svg'), mg=document.getElementById('ld-monthgrid'), ext=document.getElementById('ld-extenders'), p=document.getElementById('ld-info-panel');
    if(svg) svg.style.display='none'; if(mg) mg.style.display='none'; if(ext) ext.style.display='none'; if(p) p.style.display='block';
  }
  Info.show = async function(mode){ if(!ensureUI()) return; Info.mode=mode; showOnlyPanel(); await loadExtra(); render(mode); };
  Info.hide = hide;
  Info.refreshLabels=function(){ ensureUI(); if(Info.mode) render(Info.mode); };

  function mult(atk, d1, d2){ const m=Info.extra.typeChart; if(!atk||!d1) return null; return (m[atk]?.[d1]??1) * (d2 ? (m[atk]?.[d2]??1) : 1); }
  function toggleDefender(k){
    if(!k) return;
    const list=Info.typeState.defenders || [];
    if(list.includes(k)){ Info.typeState.defenders=list.filter(x=>x!==k); return; }
    if(list.length>=2) Info.typeState.defenders=[list[1], k];
    else Info.typeState.defenders=[...list, k];
  }
  function defenderBadges(){ const ds=Info.typeState.defenders || []; return ds.length ? ds.map(badge).join(' ') : `<span class="nd-muted">${esc(t('none'))}</span>`; }

  function renderTypes(panel){
    const st=Info.typeState, types=Info.extra.types, chart=Info.extra.typeChart, ds=st.defenders||[];
    if(!ds.length) st.defenders=['grass'];
    const selectedMult=mult(st.attack, ds[0], ds[1]);
    const header=types.map(ty=>`<th class="${ds.includes(ty.key)?'nd-selected-col':''}" data-def="${esc(ty.key)}">${badge(ty.key)}</th>`).join('');
    const rows=types.map(at=>{
      const cells=types.map(df=>{ const v=chart[at.key]?.[df.key]??1; const sel=(st.attack===at.key && ds.includes(df.key)); return `<td class="${effClass(v)} ${sel?'nd-selected-cell':''}" data-atk="${esc(at.key)}" data-def="${esc(df.key)}">${fmtMul(v)}</td>`; }).join('');
      return `<tr><th class="${st.attack===at.key?'nd-selected-row':''}" data-atk="${esc(at.key)}">${badge(at.key)}</th>${cells}</tr>`;
    }).join('');
    const grouped={superEffective:[], effective:[], neutral:[], resisted:[], doubleResisted:[]};
    for(const atk of types){ const v=mult(atk.key, ds[0], ds[1]); grouped[effBucket(v)].push({atk:atk.key,v}); }
    for(const k of Object.keys(grouped)) grouped[k].sort((a,b)=>b.v-a.v || a.atk.localeCompare(b.atk));
    const groupOrder=['superEffective','effective','neutral','resisted','doubleResisted'];
    panel.innerHTML=`<div class="nd-info-layout nd-types-layout">
      <div class="nd-info-main">
        <h2>${esc(t('types'))}</h2>
        <div class="nd-type-summary"><span>${esc(t('attackType'))}: ${badge(st.attack)}</span><span>${esc(t('defenderCombo'))}: ${defenderBadges()}</span><b class="${effClass(selectedMult||1)}">${fmtMul(selectedMult||1)}×</b></div>
        <div class="nd-table-scroll nd-type-scroll"><table class="nd-type-chart"><thead><tr><th>ATK \\ DEF</th>${header}</tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      <aside class="nd-info-side">
        <section class="nd-card"><h3>${esc(t('attackView'))}</h3><label>${esc(t('attackType'))}<select data-type-control="attack">${types.map(ty=>`<option value="${esc(ty.key)}" ${st.attack===ty.key?'selected':''}>${esc(typeLabel(ty))}</option>`).join('')}</select></label><div class="nd-pick-box"><b>${esc(t('defenderCombo'))}</b><div class="nd-chip-row">${types.map(ty=>`<button class="nd-chip ${ds.includes(ty.key)?'active':''}" data-def-chip="${esc(ty.key)}" style="--nd-type-color:${typeColors[ty.key]||'#889'}">${esc(typeLabel(ty))}</button>`).join('')}</div><p class="nd-mini-note">${esc(t('defenderHint'))}</p></div><div class="nd-big-mult ${effClass(selectedMult||1)}">${fmtMul(selectedMult||1)}×</div></section>
        <section class="nd-card"><h3>${esc(t('defenseView'))}</h3><div class="nd-defender-readout">${defenderBadges()}</div>${groupOrder.map(g=>`<div class="nd-defense-group"><h4>${esc(t(g))}</h4><div>${grouped[g].map(x=>`<span class="nd-incoming-pill ${effClass(x.v)}">${badge(x.atk)} <b>${fmtMul(x.v)}×</b></span>`).join('') || '<span class="nd-muted">-</span>'}</div></div>`).join('')}</section>
      </aside>
    </div>`;
    panel.querySelectorAll('[data-type-control="attack"]').forEach(sel=>sel.addEventListener('change',()=>{ Info.typeState.attack=sel.value; renderTypes(panel); }));
    panel.querySelectorAll('[data-def-chip]').forEach(el=>el.addEventListener('click',()=>{ toggleDefender(el.getAttribute('data-def-chip')); renderTypes(panel); }));
    panel.querySelectorAll('[data-atk]').forEach(el=>el.addEventListener('click',()=>{ Info.typeState.attack=el.getAttribute('data-atk'); const def=el.getAttribute('data-def'); if(def) toggleDefender(def); renderTypes(panel); }));
    panel.querySelectorAll('[data-def]').forEach(el=>el.addEventListener('click',()=>{ toggleDefender(el.getAttribute('data-def')); renderTypes(panel); }));
  }

  function filteredPokedex(){
    const q=norm(Info.pokedexQuery.trim());
    return (Info.extra.pokedex||[]).filter(r=>{
      if(Info.pokedexGen!=='all' && String(r.generation)!==String(Info.pokedexGen)) return false;
      if(Info.pokedexCategory==='mega' && !r.isMega) return false;
      if(Info.pokedexCategory==='dynamax' && !r.isDynamax) return false;
      if(Info.pokedexCategory==='gigantamax' && !r.isGigantamax) return false;
      if(Info.pokedexCategory==='legendary' && !r.isLegendary) return false;
      if(Info.pokedexCategory==='mythical' && !r.isMythical) return false;
      if(!q) return true;
      const hay=norm([r.search,r.Number,r.Name,r['zh-CN'],r['zh-TW'],r.ja,r.Form,r.Type1,r.Type2,r.type1Key,r.type2Key,r.generationLabel].join(' '));
      return hay.includes(q);
    });
  }
  function cpFor(row, level, atkIV, defIV, hpIV){
    const cpm=CPM[Number(level)] || CPM[Math.round(Number(level)*2)/2] || CPM[40];
    const atk=num(row.goAttack)+num(atkIV), def=num(row.goDefense)+num(defIV), sta=num(row.goStamina)+num(hpIV);
    const cp=Math.max(10, Math.floor(atk*Math.sqrt(def)*Math.sqrt(sta)*cpm*cpm/10));
    return {cp,cpm,atkEff:atk*cpm,defEff:def*cpm,hpEff:Math.floor(sta*cpm)};
  }
  function rose(row){
    const atk=num(row.goAttack), def=num(row.goDefense), hp=num(row.goStamina), max=Math.max(1, atk+15, def+15, hp+15);
    const vals=[(atk+Info.cp.atkIV)/max,(def+Info.cp.defIV)/max,(hp+Info.cp.hpIV)/max];
    const pts=vals.map((v,i)=>{ const a=(-90+i*120)*Math.PI/180, r=18+58*v; return `${80+Math.cos(a)*r},${80+Math.sin(a)*r}`; }).join(' ');
    return `<svg class="nd-rose" viewBox="0 0 160 160" aria-label="IV rose"><circle cx="80" cy="80" r="76"></circle><circle cx="80" cy="80" r="50"></circle><circle cx="80" cy="80" r="25"></circle><line x1="80" y1="4" x2="80" y2="80"></line><line x1="14" y1="118" x2="80" y2="80"></line><line x1="146" y1="118" x2="80" y2="80"></line><polygon points="${pts}"></polygon><text x="80" y="14">ATK</text><text x="12" y="134">DEF</text><text x="130" y="134">HP</text></svg>`;
  }
  function renderCalc(row){
    if(!row) return `<div class="nd-card"><h3>${esc(t('calcTitle'))}</h3><p>${esc(t('selectPokemon'))}</p></div>`;
    const calc=cpFor(row, Info.cp.level, Info.cp.atkIV, Info.cp.defIV, Info.cp.hpIV);
    const ctrl=(k,label,min,max,step)=>`<label>${esc(label)} <b>${esc(Info.cp[k])}</b><input type="range" min="${min}" max="${max}" step="${step}" value="${esc(Info.cp[k])}" data-cp="${k}"></label>`;
    return `<div class="nd-card nd-cp-card"><h3>${esc(t('calcTitle'))}</h3><div class="nd-selected-mon"><b>#${esc(row.Number)} ${esc(bestName(row))}</b><span>${badge(row.type1Key)}${row.type2Key?badge(row.type2Key):''}</span></div>${rose(row)}<div class="nd-cp-value">CP ${calc.cp}</div>${ctrl('level',t('level'),1,50,0.5)}${ctrl('atkIV',t('atkIV'),0,15,1)}${ctrl('defIV',t('defIV'),0,15,1)}${ctrl('hpIV',t('hpIV'),0,15,1)}<div class="nd-stat-grid"><div><b>${esc(t('baseStats'))}</b><br>ATK ${esc(row.goAttack)} / DEF ${esc(row.goDefense)} / STA ${esc(row.goStamina)}</div><div><b>${esc(t('effectiveStats'))}</b><br>ATK ${calc.atkEff.toFixed(1)} / DEF ${calc.defEff.toFixed(1)} / HP ${calc.hpEff}</div></div><p class="nd-formula"><b>${esc(t('formula'))}：</b>CP = floor((Atk+IV) × √(Def+IV) × √(Sta+IV) × CPM² / 10)，最低为 10。</p></div>`;
  }
  function renderPokedex(panel){
    const rows=filteredPokedex();
    if(!Info.selectedPokemonKey || !rows.some(r=>pokemonKey(r)===Info.selectedPokemonKey)) Info.selectedPokemonKey=rows[0]?pokemonKey(rows[0]):null;
    const selected=(Info.extra.pokedex||[]).find(r=>pokemonKey(r)===Info.selectedPokemonKey) || rows[0];
    const genOptions=[`<option value="all" ${Info.pokedexGen==='all'?'selected':''}>${esc(t('all'))}</option>`].concat((Info.extra.generations||[]).map(g=>`<option value="${esc(g.id)}" ${String(Info.pokedexGen)===String(g.id)?'selected':''}>${esc(g.label)} · ${esc(g.games)}</option>`)).join('');
    const cats=['all','mega','dynamax','gigantamax','legendary','mythical'];
    panel.innerHTML=`<div class="nd-info-page nd-pokedex-page"><h2>${esc(t('pokedex'))}</h2><p class="nd-info-note">${esc(t('source'))}</p><div class="nd-filter-row"><input class="nd-info-search" data-info-search="pokedex" placeholder="${esc(t('search'))}" value="${esc(Info.pokedexQuery)}"><label>${esc(t('generation'))}<select data-pokedex-filter="gen">${genOptions}</select></label><label>${esc(t('category'))}<select data-pokedex-filter="category">${cats.map(c=>`<option value="${c}" ${Info.pokedexCategory===c?'selected':''}>${esc(t(c))}</option>`).join('')}</select></label></div><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.pokedex.length} ${esc(t('rows'))}</p><div class="nd-pokedex-grid"><div class="nd-table-scroll"><table class="nd-data-table nd-pokedex-table"><thead><tr><th>#</th><th>Name</th><th>简中</th><th>繁中</th><th>Form</th><th>Gen</th><th>Type</th><th>GO ATK</th><th>GO DEF</th><th>GO STA</th><th>CP40</th><th>CP50</th></tr></thead><tbody>${rows.map(r=>`<tr data-pokedex-key="${esc(pokemonKey(r))}" class="${pokemonKey(r)===Info.selectedPokemonKey?'active':''}"><td>${esc(r.Number)}</td><td>${esc(r.Name)}</td><td>${esc(r['zh-CN'])}</td><td>${esc(r['zh-TW'])}</td><td>${esc(r.Form)}</td><td>${esc(r.generation)}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r.goAttack)}</td><td>${esc(r.goDefense)}</td><td>${esc(r.goStamina)}</td><td>${esc(r.cp40)}</td><td>${esc(r.cp50)}</td></tr>`).join('')}</tbody></table></div>${renderCalc(selected)}</div></div>`;
    const inp=panel.querySelector('[data-info-search="pokedex"]'); inp.addEventListener('input',()=>{ Info.pokedexQuery=inp.value; renderPokedex(panel); }); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    panel.querySelector('[data-pokedex-filter="gen"]').addEventListener('change',e=>{ Info.pokedexGen=e.target.value; renderPokedex(panel); });
    panel.querySelector('[data-pokedex-filter="category"]').addEventListener('change',e=>{ Info.pokedexCategory=e.target.value; renderPokedex(panel); });
    panel.querySelectorAll('[data-pokedex-key]').forEach(tr=>tr.addEventListener('click',()=>{ Info.selectedPokemonKey=tr.getAttribute('data-pokedex-key'); renderPokedex(panel); }));
    panel.querySelectorAll('[data-cp]').forEach(inp=>inp.addEventListener('input',()=>{ const k=inp.getAttribute('data-cp'); Info.cp[k]=Number(inp.value); renderPokedex(panel); }));
  }

  function renderMax(panel){
    const q=norm(Info.maxQuery.trim());
    let rows=Info.extra.max.filter(r=>!q || norm(r.search).includes(q));
    panel.innerHTML=`<div class="nd-info-page"><h2>${esc(t('max'))}</h2><p class="nd-info-note">${esc(t('maxNote'))}</p><input class="nd-info-search" data-info-search="max" placeholder="${esc(t('search'))}" value="${esc(Info.maxQuery)}"><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.max.length} ${esc(t('rows'))}</p><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>${lang()==='en'?'Name':'名称'}</th><th>LV40 CP</th><th>LV50 CP</th><th>${esc(t('bulk'))}</th><th>Type</th><th>0.5s</th><th>GO ATK</th><th>${esc(t('dmaxScore'))}</th><th>${esc(t('gmaxScore'))}</th><th>${esc(t('moves'))}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r['名称'])}</td><td>${esc(r['LV40 CP'])}</td><td>${esc(r['LV50 CP'])}</td><td>${esc(r['坦度'])}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r['0.5s 小招'])}</td><td>${esc(r['攻击'])}</td><td>${esc([r['平1'],r['平2']].filter(Boolean).join(' / '))}</td><td>${esc(r['平3'])}</td><td>${esc([r['极巨技能1'],r['极巨技能2'],r['超极巨技能']].filter(Boolean).join(' / '))}</td></tr>`).join('')}</tbody></table></div></div>`;
    const inp=panel.querySelector('[data-info-search="max"]'); inp.addEventListener('input',()=>{ Info.maxQuery=inp.value; renderMax(panel); }); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  function render(mode){ const panel=document.getElementById('ld-info-panel'); if(!panel) return; if(mode==='types') renderTypes(panel); else if(mode==='pokedex') renderPokedex(panel); else if(mode==='max') renderMax(panel); }
  Info.init=function(opts){ Info.opts=opts||{}; ensureUI(); };
  window.ND_Info=Info;
})();
