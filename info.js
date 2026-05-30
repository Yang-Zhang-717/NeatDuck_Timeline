// == info.js v1.0.6 ==
(function(){
  const Info = { extra:null, mode:null, typeState:{attack:'fire', def1:'grass', def2:'', own1:'dragon', own2:'flying'}, pokedexQuery:'', maxQuery:'' };
  const typeColors={normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'};
  const labels={
    'zh-CN':{types:'属性克制',pokedex:'图鉴',max:'极巨化',attackView:'攻击视角',defenseView:'防御视角',attackType:'攻击属性',defenderType1:'被攻击属性 1',defenderType2:'被攻击属性 2',ownType1:'你的属性 1',ownType2:'你的属性 2',none:'无',multiplier:'伤害倍率',incoming:'受到这些攻击时',note:'表格为 Pokémon GO 倍率：单一攻击属性 × 一个或两个防御属性。复合防御时倍率相乘。是的，乘法，宇宙终于给了我们一点秩序。',search:'搜索名称 / 编号 / 属性',showing:'显示',rows:'行',source:'数据来自 Pokemon.xlsx，并用 PokeAPI 静态 CSV 补全名称与属性表。'},
    'zh-TW':{types:'屬性克制',pokedex:'圖鑑',max:'極巨化',attackView:'攻擊視角',defenseView:'防禦視角',attackType:'攻擊屬性',defenderType1:'被攻擊屬性 1',defenderType2:'被攻擊屬性 2',ownType1:'你的屬性 1',ownType2:'你的屬性 2',none:'無',multiplier:'傷害倍率',incoming:'受到這些攻擊時',note:'表格為 Pokémon GO 倍率：單一攻擊屬性 × 一個或兩個防禦屬性。複合防禦時倍率相乘。乘法，奇蹟般地沒有背叛人類。',search:'搜尋名稱 / 編號 / 屬性',showing:'顯示',rows:'列',source:'資料來自 Pokemon.xlsx，並用 PokeAPI 靜態 CSV 補全名稱與屬性表。'},
    en:{types:'Type Chart',pokedex:'Pokédex',max:'Dynamax',attackView:'Attack view',defenseView:'Defense view',attackType:'Attack type',defenderType1:'Defender type 1',defenderType2:'Defender type 2',ownType1:'Your type 1',ownType2:'Your type 2',none:'None',multiplier:'Damage multiplier',incoming:'Incoming attacks',note:'Pokémon GO multipliers: one attacking type × one or two defender types. Dual-type defense multiplies the two values. Multiplication, somehow still legal.',search:'Search name / number / type',showing:'Showing',rows:'rows',source:'Data comes from Pokemon.xlsx, supplemented with PokeAPI static CSV for names and the type chart.'}
  };
  function lang(){ return (Info.opts && Info.opts.getLang && Info.opts.getLang()) || (window.LDT_Core && LDT_Core.DEFAULT_LANG) || 'zh-CN'; }
  function t(k){ const l=lang(); return (labels[l]||labels.en)[k] || labels.en[k] || k; }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function typeLabel(type){ const l=lang(); return type[l] || type['zh-CN'] || type.en || type.key; }
  function typeByKey(k){ return (Info.extra && Info.extra.types || []).find(x=>x.key===k); }
  function badge(k){ const ty=typeByKey(k); if(!ty) return ''; return `<span class="nd-type-badge" style="--nd-type-color:${typeColors[k]||'#889'}">${esc(typeLabel(ty))}</span>`; }
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
    if(!document.getElementById('nd-info-buttons')){
      const row=top.querySelector('.row:last-child') || top;
      const span=document.createElement('span'); span.id='nd-info-buttons'; span.className='nd-info-buttons';
      span.innerHTML=`<button class="btn" data-info-mode="types">🧬 <span>${esc(t('types'))}</span></button><button class="btn" data-info-mode="pokedex">📖 <span>${esc(t('pokedex'))}</span></button><button class="btn" data-info-mode="max">🛡️ <span>${esc(t('max'))}</span></button>`;
      row.appendChild(span);
    } else {
      const b=document.getElementById('nd-info-buttons'); const ks=['types','pokedex','max']; b.querySelectorAll('button span').forEach((s,i)=>s.textContent=t(ks[i]));
    }
    if(!document.getElementById('ld-info-panel')){
      const panel=document.createElement('div'); panel.id='ld-info-panel'; panel.style.display='none'; right.appendChild(panel);
    }
    if(!top.__ndInfoBound){ top.addEventListener('click', ev=>{ const b=ev.target.closest('[data-info-mode]'); if(!b) return; ev.preventDefault(); Info.show(b.getAttribute('data-info-mode')); }); top.__ndInfoBound=true; }
    return true;
  }
  function hide(){ const p=document.getElementById('ld-info-panel'); if(p) p.style.display='none'; Info.mode=null; }
  function showOnlyPanel(){
    const svg=document.getElementById('ld-timeline-svg'), mg=document.getElementById('ld-monthgrid'), p=document.getElementById('ld-info-panel');
    if(svg) svg.style.display='none'; if(mg) mg.style.display='none'; if(p) p.style.display='block';
  }
  Info.show = async function(mode){ if(!ensureUI()) return; Info.mode=mode; showOnlyPanel(); await loadExtra(); render(mode); };
  Info.hide = hide;
  Info.refreshLabels=function(){ ensureUI(); if(Info.mode) render(Info.mode); };
  function selectOptions(selected, includeNone){
    const opts=[]; if(includeNone) opts.push(`<option value="">${esc(t('none'))}</option>`);
    for(const ty of Info.extra.types){ opts.push(`<option value="${esc(ty.key)}" ${selected===ty.key?'selected':''}>${esc(typeLabel(ty))}</option>`); }
    return opts.join('');
  }
  function mult(atk, d1, d2){ const m=Info.extra.typeChart; if(!atk||!d1) return null; return (m[atk]?.[d1]??1) * (d2 ? (m[atk]?.[d2]??1) : 1); }
  function renderTypes(panel){
    const st=Info.typeState, types=Info.extra.types, chart=Info.extra.typeChart;
    const selectedMult=mult(st.attack, st.def1, st.def2);
    let incoming=[];
    for(const atk of types){ const v=mult(atk.key, st.own1, st.own2); incoming.push({atk:atk.key,v}); }
    incoming.sort((a,b)=>b.v-a.v || a.atk.localeCompare(b.atk));
    const header=types.map(ty=>`<th class="${st.def1===ty.key||st.def2===ty.key?'nd-selected-col':''}" data-def="${esc(ty.key)}">${badge(ty.key)}</th>`).join('');
    const rows=types.map(at=>{
      const cells=types.map(df=>{ const v=chart[at.key]?.[df.key]??1; const sel=(st.attack===at.key && (st.def1===df.key||st.def2===df.key)); return `<td class="${effClass(v)} ${sel?'nd-selected-cell':''}" data-atk="${esc(at.key)}" data-def="${esc(df.key)}">${fmtMul(v)}</td>`; }).join('');
      return `<tr><th class="${st.attack===at.key?'nd-selected-row':''}" data-atk="${esc(at.key)}">${badge(at.key)}</th>${cells}</tr>`;
    }).join('');
    panel.innerHTML=`<div class="nd-info-layout nd-types-layout"><div class="nd-info-main"><h2>${esc(t('types'))}</h2><p class="nd-info-note">${esc(t('note'))}</p><div class="nd-table-scroll"><table class="nd-type-chart"><thead><tr><th>ATK \\ DEF</th>${header}</tr></thead><tbody>${rows}</tbody></table></div></div><aside class="nd-info-side"><section class="nd-card"><h3>${esc(t('attackView'))}</h3><label>${esc(t('attackType'))}<select data-type-control="attack">${selectOptions(st.attack,false)}</select></label><label>${esc(t('defenderType1'))}<select data-type-control="def1">${selectOptions(st.def1,false)}</select></label><label>${esc(t('defenderType2'))}<select data-type-control="def2">${selectOptions(st.def2,true)}</select></label><div class="nd-big-mult ${effClass(selectedMult||1)}">${fmtMul(selectedMult||1)}×</div><div>${badge(st.attack)} → ${badge(st.def1)} ${st.def2?badge(st.def2):''}</div></section><section class="nd-card"><h3>${esc(t('defenseView'))}</h3><label>${esc(t('ownType1'))}<select data-type-control="own1">${selectOptions(st.own1,false)}</select></label><label>${esc(t('ownType2'))}<select data-type-control="own2">${selectOptions(st.own2,true)}</select></label><div class="nd-incoming-list"><b>${esc(t('incoming'))}</b>${incoming.map(x=>`<div class="nd-incoming-row ${effClass(x.v)}"><span>${badge(x.atk)}</span><b>${fmtMul(x.v)}×</b></div>`).join('')}</div></section></aside></div>`;
    panel.querySelectorAll('[data-type-control]').forEach(sel=>sel.addEventListener('change',()=>{ Info.typeState[sel.getAttribute('data-type-control')]=sel.value; renderTypes(panel); }));
    panel.querySelectorAll('[data-atk]').forEach(el=>el.addEventListener('click',()=>{ Info.typeState.attack=el.getAttribute('data-atk'); renderTypes(panel); }));
    panel.querySelectorAll('[data-def]').forEach(el=>el.addEventListener('click',()=>{ const k=el.getAttribute('data-def'); if(Info.typeState.def1===k) Info.typeState.def2=k; else Info.typeState.def1=k; renderTypes(panel); }));
  }
  function renderPokedex(panel){
    const q=Info.pokedexQuery.trim().toLowerCase();
    let rows=Info.extra.pokedex.filter(r=>!q || r.search.includes(q)).slice(0,300);
    panel.innerHTML=`<div class="nd-info-page"><h2>${esc(t('pokedex'))}</h2><p class="nd-info-note">${esc(t('source'))}</p><input class="nd-info-search" data-info-search="pokedex" placeholder="${esc(t('search'))}" value="${esc(Info.pokedexQuery)}"><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.pokedex.length} ${esc(t('rows'))}</p><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>#</th><th>Name</th><th>简中</th><th>繁中</th><th>日文</th><th>Form</th><th>Type</th><th>Total</th><th>HP</th><th>Atk</th><th>Def</th><th>SpA</th><th>SpD</th><th>Spe</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.Number)}</td><td>${esc(r.Name)}</td><td>${esc(r['zh-CN'])}</td><td>${esc(r['zh-TW'])}</td><td>${esc(r.ja)}</td><td>${esc(r.Form)}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r.Total)}</td><td>${esc(r.HP)}</td><td>${esc(r.Attack)}</td><td>${esc(r.Defense)}</td><td>${esc(r['Sp.Attack'])}</td><td>${esc(r['Sp.Defense'])}</td><td>${esc(r.Speed)}</td></tr>`).join('')}</tbody></table></div></div>`;
    const inp=panel.querySelector('[data-info-search="pokedex"]'); inp.addEventListener('input',()=>{ Info.pokedexQuery=inp.value; renderPokedex(panel); }); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  function renderMax(panel){
    const q=Info.maxQuery.trim().toLowerCase();
    let rows=Info.extra.max.filter(r=>!q || r.search.includes(q));
    panel.innerHTML=`<div class="nd-info-page"><h2>${esc(t('max'))}</h2><p class="nd-info-note">${esc(t('source'))}</p><input class="nd-info-search" data-info-search="max" placeholder="${esc(t('search'))}" value="${esc(Info.maxQuery)}"><p class="nd-info-count">${esc(t('showing'))} ${rows.length} / ${Info.extra.max.length} ${esc(t('rows'))}</p><div class="nd-table-scroll"><table class="nd-data-table"><thead><tr><th>名称</th><th>LV40</th><th>LV50</th><th>坦度</th><th>属性</th><th>0.5s 小招</th><th>攻击</th><th>极巨技能</th><th>平</th><th>超极巨技能</th><th>平</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r['名称'])}</td><td>${esc(r['LV40 CP'])}</td><td>${esc(r['LV50 CP'])}</td><td>${esc(r['坦度'])}</td><td>${badge(r.type1Key)}${r.type2Key?badge(r.type2Key):''}</td><td>${esc(r['0.5s 小招'])}</td><td>${esc(r['攻击'])}</td><td>${esc([r['极巨技能1'],r['极巨技能2']].filter(Boolean).join(' / '))}</td><td>${esc([r['平1'],r['平2']].filter(Boolean).join(' / '))}</td><td>${esc(r['超极巨技能'])}</td><td>${esc(r['平3'])}</td></tr>`).join('')}</tbody></table></div></div>`;
    const inp=panel.querySelector('[data-info-search="max"]'); inp.addEventListener('input',()=>{ Info.maxQuery=inp.value; renderMax(panel); }); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  function render(mode){ const panel=document.getElementById('ld-info-panel'); if(!panel) return; if(mode==='types') renderTypes(panel); else if(mode==='pokedex') renderPokedex(panel); else renderMax(panel); }
  Info.init=function(opts){ Info.opts=opts||{}; ensureUI(); };
  window.ND_Info=Info;
})();
