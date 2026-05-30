// == info.js v1.0.7 ==
(function(){
  const Info = {
    extra:null, mode:null,
    typeState:{attack:'fire', def1:'grass', def2:'poison'},
    pokedexQuery:'', pokedexGeneration:'all', maxQuery:''
  };
  const typeColors={normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'};
  const labels={
    'zh-CN':{calendar:'Activity Calendar',types:'属性克制',pokedex:'宝可梦图鉴',max:'极巨化',attackView:'攻击视角',defenseView:'防御视角',attackType:'攻击属性',defenderTypes:'被攻击属性',defenderHint:'点击表格顶部属性，最多按顺序选择两个；重复点击会取消。',none:'无',multiplier:'伤害倍率',incoming:'受到这些攻击时',search:'搜索名称 / 编号 / 属性，可直接输入中文',showing:'显示',rows:'行',source:'图鉴基础表来自 Pokemon.xlsx + PokeAPI 静态 CSV；CP/极巨页补充 Pokémon GO 资料。',generation:'世代',allGenerations:'全部世代',superWeak:'超级有效',effective:'有效',normal:'一般',resisted:'无效',superResisted:'超级无效',maxPower:'Max/G-Max 技能威力',maxPowerNote:'极巨攻击基础威力：250 / 300 / 350；超极巨攻击：350 / 400 / 450。下方“平”列按攻击值×威力/1000作粗略输出指数。'},
    'zh-TW':{calendar:'Activity Calendar',types:'屬性克制',pokedex:'寶可夢圖鑑',max:'極巨化',attackView:'攻擊視角',defenseView:'防禦視角',attackType:'攻擊屬性',defenderTypes:'被攻擊屬性',defenderHint:'點擊表格頂部屬性，最多依序選兩個；重複點擊會取消。',none:'無',multiplier:'傷害倍率',incoming:'受到這些攻擊時',search:'搜尋名稱 / 編號 / 屬性，可直接輸入中文',showing:'顯示',rows:'列',source:'圖鑑基礎表來自 Pokemon.xlsx + PokeAPI 靜態 CSV；CP/極巨頁補充 Pokémon GO 資料。',generation:'世代',allGenerations:'全部世代',superWeak:'超級有效',effective:'有效',normal:'一般',resisted:'無效',superResisted:'超級無效',maxPower:'Max/G-Max 技能威力',maxPowerNote:'極巨攻擊基礎威力：250 / 300 / 350；超極巨攻擊：350 / 400 / 450。下方「平」列按攻擊值×威力/1000作粗略輸出指數。'},
    en:{calendar:'Activity Calendar',types:'Type Chart',pokedex:'Pokédex',max:'Dynamax',attackView:'Attack view',defenseView:'Defense view',attackType:'Attack type',defenderTypes:'Defender type(s)',defenderHint:'Click defender types in the table header. Up to two are kept in click order; clicking again removes one.',none:'None',multiplier:'Damage multiplier',incoming:'Incoming attacks',search:'Search name / number / type, Chinese input supported',showing:'Showing',rows:'rows',source:'Base Pokédex data comes from Pokemon.xlsx + PokeAPI static CSV; CP/Max data is supplemented with Pokémon GO references.',generation:'Generation',allGenerations:'All generations',superWeak:'Double weak',effective:'Weak',normal:'Neutral',resisted:'Resisted',superResisted:'Double resisted',maxPower:'Max/G-Max power',maxPowerNote:'Max Attack base power: 250 / 300 / 350; G-Max Attack: 350 / 400 / 450. “Avg” columns use Attack × power / 1000 as a rough output index.'}
  };
  function lang(){ return (Info.opts && Info.opts.getLang && Info.opts.getLang()) || (window.LDT_Core && LDT_Core.DEFAULT_LANG) || 'zh-CN'; }
  function t(k){ const l=lang(); return (labels[l]||labels.en)[k] || labels.en[k] || k; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function norm(v){ return String(v==null?'':v).trim().toLowerCase(); }
  function typeLabel(type){ const l=lang(); return type[l] || type['zh-CN'] || type.en || type.key; }
  function typeByKey(k){ return (Info.extra && Info.extra.types || []).find(x=>x.key===k); }
  function badge(k){ const ty=typeByKey(k); if(!ty) return ''; return `<span class="nd-type-badge" data-type-badge="${esc(k)}" style="--nd-type-color:${typeColors[k]||'#889'}">${esc(typeLabel(ty))}</span>`; }
  function fmtMul(v){ if(!isFinite(v)) return ''; if (Math.abs(v-1)<1e-9) return '1'; if (Math.abs(v-0.390625)<1e-9) return '0.390625'; return String(Math.round(v*1000000)/1000000).replace(/\.0$/,''); }
  function effClass(v){ if(v>1.01) return 'nd-eff-high'; if(v<0.5) return 'nd-eff-immune'; if(v<0.99) return 'nd-eff-low'; return 'nd-eff-one'; }
  async function loadExtra(){
    if(Info.extra) return Info.extra;
    let url='assets/pokemon_extra.json';
    try{ if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.getURL) url=chrome.runtime.getURL(url); }catch(_){ }
    const res=await fetch(url); Info.extra=await res.json(); return Info.extra;
  }
  function ensureUI(){
    const top=document.getElementById('ld-topbar'); const right=document.getElementById('ld-right'); if(!top||!right) return false;
    if(!top.querySelector('[data-main-tab]')){
      const row=document.createElement('div'); row.className='row nd-main-tabs';
      row.innerHTML=`<button class="btn nd-tab active" data-main-tab="calendar">🗓️ <span></span></button><button class="btn nd-tab" data-main-tab="types">🧬 <span></span></button><button class="btn nd-tab" data-main-tab="pokedex">📖 <span></span></button><button class="btn nd-tab" data-main-tab="max">🛡️ <span></span></button>`;
      top.insertBefore(row, top.firstChild);
    }
    if(!document.getElementById('ld-info-panel')){
      const panel=document.createElement('div'); panel.id='ld-info-panel'; panel.style.display='none'; right.appendChild(panel);
    }
    refreshTabLabels();
    if(!top.__ndInfoBound){
      top.addEventListener('click', ev=>{
        const b=ev.target.closest('[data-main-tab]'); if(!b) return;
        ev.preventDefault();
        const mode=b.getAttribute('data-main-tab');
        if(mode==='calendar') Info.showCalendar(); else Info.show(mode);
      });
      top.__ndInfoBound=true;
    }
    return true;
  }
  function refreshTabLabels(){
    const map={calendar:'calendar',types:'types',pokedex:'pokedex',max:'max'};
    document.querySelectorAll('[data-main-tab]').forEach(b=>{ const sp=b.querySelector('span')||b; const key=map[b.getAttribute('data-main-tab')]; if(key) sp.textContent=t(key); });
  }
  function setActiveTab(mode){ document.querySelectorAll('[data-main-tab]').forEach(b=>b.classList.toggle('active', b.getAttribute('data-main-tab')===(mode||'calendar'))); }
  function hide(){ const p=document.getElementById('ld-info-panel'); if(p) p.style.display='none'; Info.mode=null; setActiveTab('calendar'); }
  Info.showCalendar=function(){ hide(); if(Info.opts && Info.opts.showCalendar) Info.opts.showCalendar(); else { const svg=document.getElementById('ld-timeline-svg'); if(svg) svg.style.display='block'; } };
  function showOnlyPanel(){
    const svg=document.getElementById('ld-timeline-svg'), mg=document.getElementById('ld-monthgrid'), p=document.getElementById('ld-info-panel');
    if(svg) svg.style.display='none'; if(mg) mg.style.display='none'; if(p) p.style.display='block';
  }
  Info.show = async function(mode){ if(!ensureUI()) return; Info.mode=mode; setActiveTab(mode); showOnlyPanel(); await loadExtra(); render(mode); };
  Info.hide = hide;
  Info.refreshLabels=function(){ ensureUI(); refreshTabLabels(); if(Info.mode) render(Info.mode); };
  function selectOptions(selected, includeNone){
    const opts=[]; if(includeNone) opts.push(`<option value="">${esc(t('none'))}</option>`);
    for(const ty of Info.extra.types){ opts.push(`<option value="${esc(ty.key)}" ${selected===ty.key?'selected':''}>${esc(typeLabel(ty))}</option>`); }
    return opts.join('');
  }
  function mult(atk, d1, d2){ const m=Info.extra.typeChart; if(!atk||!d1) return null; return (m[atk]?.[d1]??1) * (d2 && d2!==d1 ? (m[atk]?.[d2]??1) : 1); }
  function setDefender(k){
    const st=Info.typeState; if(!k) return;
    if(st.def1===k){ st.def1=st.def2||''; st.def2=''; return; }
    if(st.def2===k){ st.def2=''; return; }
    if(!st.def1){ st.def1=k; return; }
    if(!st.def2){ st.def2=k; return; }
    st.def1=st.def2; st.def2=k;
  }
  function normalizeDefenders(){ const st=Info.typeState; if(st.def1 && st.def2 && st.def1===st.def2) st.def2=''; if(!st.def1 && st.def2){ st.def1=st.def2; st.def2=''; } }
  function incomingBucket(v){ if(v>1.61) return 'superWeak'; if(v>1.01) return 'effective'; if(v<0.5) return 'superResisted'; if(v<0.99) return 'resisted'; return 'normal'; }
  function renderTypes(panel){
    normalizeDefenders();
    const st=Info.typeState, types=Info.extra.types, chart=Info.extra.typeChart;
    const selectedMult=mult(st.attack, st.def1, st.def2);
    const buckets={superWeak:[], effective:[], normal:[], resisted:[], superResisted:[]};
    for(const atk of types){ const v=mult(atk.key, st.def1, st.def2); buckets[incomingBucket(v)].push({atk:atk.key,v}); }
    const header=types.map(ty=>`<th class="${st.def1===ty.key||st.def2===ty.key?'nd-selected-col':''}" data-def="${esc(ty.key)}">${badge(ty.key)}</th>`).join('');
    const rows=types.map(at=>{
      const cells=types.map(df=>{ const v=chart[at.key]?.[df.key]??1; const sel=(st.attack===at.key && (st.def1===df.key||st.def2===df.key)); return `<td class="${effClass(v)} ${sel?'nd-selected-cell':''}" data-atk="${esc(at.key)}" data-def="${esc(df.key)}">${fmtMul(v)}</td>`; }).join('');
      return `<tr><th class="${st.attack===at.key?'nd-selected-row':''}" data-atk="${esc(at.key)}">${badge(at.key)}</th>${cells}</tr>`;
    }).join('');
    const compact = ['superWeak','effective','normal','resisted','superResisted'].map(k=>`<div class="nd-defense-bucket"><b>${esc(t(k))}</b><span>${buckets[k].map(x=>`${badge(x.atk)}<small>${fmtMul(x.v)}×</small>`).join('')}</span></div>`).join('');
    panel.innerHTML=`<div class="nd-info-layout nd-types-layout"><div class="nd-info-main"><h2>${esc(t('types'))}</h2><div class="nd-table-scroll"><table class="nd-type-chart"><thead><tr><th>ATK \\ DEF</th>${header}</tr></thead><tbody>${rows}</tbody></table></div></div><aside class="nd-info-side"><section class="nd-card"><h3>${esc(t('attackView'))}</h3><label>${esc(t('attackType'))}<select data-type-control="attack">${selectOptions(st.attack,false)}</select></label><label>${esc(t('defenderTypes'))}<span class="nd-defender-picked">${badge(st.def1)}${st.def2?badge(st.def2):''}</span></label><div class="nd-type-pickers">${types.map(ty=>`<button class="nd-type-pick ${st.def1===ty.key||st.def2===ty.key?'active':''}" data-def-pick="${esc(ty.key)}">${badge(ty.key)}</button>`).join('')}</div><p class="nd-mini-note">${esc(t('defenderHint'))}</p><div class="nd-big-mult ${effClass(selectedMult||1)}">${fmtMul(selectedMult||1)}×</div><div>${badge(st.attack)} → ${badge(st.def1)} ${st.def2?badge(st.def2):''}</div></section><section class="nd-card"><h3>${esc(t('defenseView'))}</h3><div class="nd-compact-defense"><b>${esc(t('incoming'))}: ${badge(st.def1)}${st.def2?badge(st.def2):''}</b>${compact}</div></section></aside></div>`;
    panel.querySelectorAll('[data-type-control]').forEach(sel=>sel.addEventListener('change',()=>{ Info.typeState[sel.getAttribute('data-type-control')]=sel.value; normalizeDefenders(); renderTypes(panel); }));
    panel.querySelectorAll('[data-atk]').forEach(el=>el.addEventListener('click',()=>{ Info.typeState.attack=el.getAttribute('data-atk'); renderTypes(panel); }));
    panel.querySelectorAll('[data-def], [data-def-pick]').forEach(el=>el.addEventListener('click',()=>{ setDefender(el.getAttribute('data-def') || el.getAttribute('data-def-pick')); renderTypes(panel); }));
  }
  function generationOptions(){
    const gens=Array.from(new Set((Info.extra.pokedex||[]).map(r=>r.Generation).filter(Boolean))).sort((a,b)=>Number(a)-Number(b));
    return `<option value="all">${esc(t('allGenerations'))}</option>` + gens.map(g=>`<option value="${esc(g)}" ${Info.pokedexGeneration===String(g)?'selected':''}>Gen ${esc(g)}</option>`).join('');
  }
  function bindSearchInput(inp, onValue){
    inp.addEventListener('compositionstart',()=>{ inp.__composing=true; });
    inp.addEventListener('compositionend',()=>{ inp.__composing=false; onValue(inp.value); });
    inp.addEventListener('input',()=>{ if(inp.__composing) return; onValue(inp.value); });
    inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  function renderPokedex(panel){
    const q=norm(Info.pokedexQuery);
    let rows=Info.extra.pokedex.filter(r=>{
      const genOk=Info.pokedexGeneration==='all' || String(r.Generation||'')===String(Info.pokedexGeneration);
      return genOk && (!q || norm(r.search).includes(q) || norm([r.Name,r['zh-CN'],r['zh-TW'],r.ja,r.Number,r.Form].join(' ')).includes(q));
    });
    panel.innerHTML=`<div class="nd-info-page"><h2>${esc(t('pokedex'))}</h2><p class="nd-info-note">${esc(t('source'))}</p><div class="nd-filter-row"><input class="nd-info-search" data-info-search="pokedex" placeholder="${esc(t('search'))}" value="${esc(Info.pokedexQuery)}"><label>${esc(t('generation'))}<select class="nd-info-select" data-info-generation>${generationOptions()}</select></label></div><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.pokedex.length} ${esc(t('rows'))}</p><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>#</th><th>Name</th><th>简中</th><th>繁中</th><th>日文</th><th>Form</th><th>Type</th><th>Total</th><th>HP</th><th>Atk</th><th>Def</th><th>SpA</th><th>SpD</th><th>Spe</th><th>Gen</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.Number)}</td><td>${esc(r.Name)}</td><td>${esc(r['zh-CN'])}</td><td>${esc(r['zh-TW'])}</td><td>${esc(r.ja)}</td><td>${esc(r.Form)}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r.Total)}</td><td>${esc(r.HP)}</td><td>${esc(r.Attack)}</td><td>${esc(r.Defense)}</td><td>${esc(r['Sp.Attack'])}</td><td>${esc(r['Sp.Defense'])}</td><td>${esc(r.Speed)}</td><td>${esc(r.Generation)}</td></tr>`).join('')}</tbody></table></div></div>`;
    const inp=panel.querySelector('[data-info-search="pokedex"]'); bindSearchInput(inp, v=>{ Info.pokedexQuery=v; renderPokedex(panel); });
    const gen=panel.querySelector('[data-info-generation]'); gen.addEventListener('change',()=>{ Info.pokedexGeneration=gen.value; renderPokedex(panel); });
  }
  function renderMax(panel){
    const q=norm(Info.maxQuery);
    let rows=Info.extra.max.filter(r=>!q || norm(r.search).includes(q) || norm([r['名称'],r['属性1'],r['属性2'],r['极巨技能1'],r['极巨技能2'],r['超极巨技能']].join(' ')).includes(q));
    const mp=(Info.extra.meta&&Info.extra.meta.maxMovePower)||{dynamax:[250,300,350],gigantamax:[350,400,450]};
    panel.innerHTML=`<div class="nd-info-page"><h2>${esc(t('max'))}</h2><p class="nd-info-note">${esc(t('source'))}</p><p class="nd-info-note"><b>${esc(t('maxPower'))}</b>: D-Max ${esc(mp.dynamax.join(' / '))}; G-Max ${esc(mp.gigantamax.join(' / '))}. ${esc(t('maxPowerNote'))}</p><input class="nd-info-search" data-info-search="max" placeholder="${esc(t('search'))}" value="${esc(Info.maxQuery)}"><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.max.length} ${esc(t('rows'))}</p><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>名称</th><th>LV40</th><th>LV50</th><th>坦度</th><th>属性</th><th>0.5s 小招</th><th>攻击</th><th>极巨技能</th><th>平</th><th>超极巨技能</th><th>平</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r['名称'])}</td><td>${esc(r['LV40 CP'])}</td><td>${esc(r['LV50 CP'])}</td><td>${esc(r['坦度'])}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r['0.5s 小招'])}</td><td>${esc(r['攻击'])}</td><td>${esc([r['极巨技能1'],r['极巨技能2']].filter(Boolean).join(' / '))}</td><td>${esc([r['平1'],r['平2']].filter(Boolean).join(' / '))}</td><td>${esc(r['超极巨技能'])}</td><td>${esc(r['平3'])}</td></tr>`).join('')}</tbody></table></div></div>`;
    const inp=panel.querySelector('[data-info-search="max"]'); bindSearchInput(inp, v=>{ Info.maxQuery=v; renderMax(panel); });
  }
  function render(mode){ const panel=document.getElementById('ld-info-panel'); if(!panel) return; if(mode==='types') renderTypes(panel); else if(mode==='pokedex') renderPokedex(panel); else renderMax(panel); }
  Info.init=function(opts){ Info.opts=opts||{}; ensureUI(); };
  window.ND_Info=Info;
})();
