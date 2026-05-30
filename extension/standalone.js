// == standalone.js v1.0.5 ==
(function(){
  const C = LDT_Core.CONST;
  let state={ lang:LDT_Core.DEFAULT_LANG, events:[], colors:{...LDT_Core.DEFAULT_COLORS}, settings:LDT_Core.normalizeSettings({}), rangeStart:null, rangeEnd:null, viewMode:"linear", displayTimeZone:"local", pokemonDB:null, detailsCache:{}, selectedIds:new Set(), remoteUrl:LDT_Core.DEFAULT_REMOTE_URL };


  function applyI18n(){
    const dict=LDT_Core.I18N[state.lang] || LDT_Core.I18N.en || {};
    document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); el.textContent=dict[k]||k; });
  }

  function laneLayout(){
    let y=C.TIMELINE_TOP_PAD || 58; const map={};
    for (const lane of LDT_Core.LANES_SPEC){
      if (lane.sub && lane.sub.length){
        for (const sub of lane.sub){ map[`${lane.key}::${sub}`]=y; y += C.ITEM_H + C.ITEM_GAP; }
      } else { map[`${lane.key}::${lane.key}`]=y; y += C.ITEM_H + C.ITEM_GAP; }
      y += C.GROUP_GAP;
    }
    return { ymap: map, contentBottom: y+10 };
  }

  function renderLegend(layout){
    const svg = document.getElementById("ld-legend-svg"); if(!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const g=document.createElementNS("http://www.w3.org/2000/svg","g"); svg.appendChild(g);
    Array.from(new Set(Object.values(layout.ymap))).sort((a,b)=>a-b).forEach(y=>{
      const line=document.createElementNS("http://www.w3.org/2000/svg","line");
      line.setAttribute("x1",0); line.setAttribute("x2",C.LEGEND_W); line.setAttribute("y1",y-1); line.setAttribute("y2",y-1); line.setAttribute("class","ld-legend-sep"); g.appendChild(line);
    });
    for (const lane of LDT_Core.LANES_SPEC){
      if (lane.sub && lane.sub.length){
        for (const sub of lane.sub){
          const y = layout.ymap[`${lane.key}::${sub}`];
          const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
          rect.setAttribute("x", 8); rect.setAttribute("y", y); rect.setAttribute("width", 12); rect.setAttribute("height", C.ITEM_H); rect.style.fill = state.colors[sub] || LDT_Core.hashColor(sub); g.appendChild(rect);
          const text=document.createElementNS("http://www.w3.org/2000/svg","text");
          text.setAttribute("x", 28); text.setAttribute("y", y + C.ITEM_H/2); text.setAttribute("class","legend-label"); text.textContent=LDT_Core.localizeCategoryLabel(sub, state.lang); g.appendChild(text);
        }
      } else {
        const y = layout.ymap[`${lane.key}::${lane.key}`];
        const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
        rect.setAttribute("x", 8); rect.setAttribute("y", y); rect.setAttribute("width", 12); rect.setAttribute("height", C.ITEM_H); rect.style.fill = state.colors[lane.key] || "#999999"; g.appendChild(rect);
        const text=document.createElementNS("http://www.w3.org/2000/svg","text");
        text.setAttribute("x", 28); text.setAttribute("y", y + C.ITEM_H/2); text.setAttribute("class","legend-label"); text.textContent=lane.title; g.appendChild(text);
      }
    }
  }

  function chooseTickStep(rangeStart, rangeEnd){
    const spanMs = rangeEnd - rangeStart;
    const rules=[{type:"hour",step:1},{type:"hour",step:3},{type:"hour",step:6},{type:"day",step:1},{type:"day",step:2},{type:"weekMon",step:1},{type:"weekMon",step:2},{type:"month1",step:1}];
    function count(r){
      if(r.type==="hour") return Math.floor(spanMs/(r.step*3600000))+1;
      if(r.type==="day") return Math.floor(spanMs/(r.step*86400000))+1;
      if(r.type==="weekMon"){let c=0; let t=LDT_Core.mondayOfWeek(new Date(rangeStart)); while(+t<=rangeEnd){c++; t=LDT_Core.addDays(t,7*r.step);} return c;}
      if(r.type==="month1"){let c=0; let t=LDT_Core.monthStart(new Date(rangeStart)); while(+t<=rangeEnd){c++; t=LDT_Core.nextMonthStart(t);} return c;}
      return 5;
    }
    for(const r of rules){ if(count(r)<=13) return r; }
    return rules[rules.length-1];
  }
  function buildTicks(rule, rangeStart, rangeEnd){
    const out=[];
    if(rule.type==="hour"){const step=rule.step*3600000; let t=new Date(rangeStart); t.setMinutes(0,0,0); while(+t<=rangeEnd){ out.push(new Date(t)); t=new Date(+t+step);} }
    else if(rule.type==="day"){const step=rule.step*86400000; let t=LDT_Core.beginOfDay(new Date(rangeStart)); while(+t<=rangeEnd){ out.push(new Date(t)); t=new Date(+t+step);} }
    else if(rule.type==="weekMon"){ let t=LDT_Core.mondayOfWeek(new Date(rangeStart)); while(+t<=rangeEnd){ out.push(new Date(t)); t=LDT_Core.addDays(t,7*rule.step);} }
    else if(rule.type==="month1"){ let t=LDT_Core.monthStart(new Date(rangeStart)); while(+t<=rangeEnd){ out.push(new Date(t)); t=LDT_Core.nextMonthStart(t);} }
    return out;
  }
  function fmtTick(rule, d){
    const pad=n=>String(n).padStart(2,"0");
    if(rule.type==="hour") return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:00`;
    if(rule.type==="day") return `${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
    if(rule.type==="weekMon") return `Mon ${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
    if(rule.type==="month1"){ const m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${m[d.getMonth()]} ${d.getFullYear()}`;}
    return d.toLocaleString();
  }

  function renderBackground(svg, rangeStart, rangeEnd){
    const monthBg=svg.querySelector("#ld-month-bgs"); const weekendBg=svg.querySelector("#ld-weekend-bgs"); monthBg.innerHTML=""; weekendBg.innerHTML="";
    const useMonth = LDT_Core.isRangeOverNdays(rangeStart, rangeEnd, 90); const xScale=t=>((t-rangeStart)/(rangeEnd-rangeStart))*C.TL_W; if(!isFinite(xScale(rangeStart))) return;
    if (useMonth){ let t=LDT_Core.monthStart(new Date(rangeStart)); let odd=t.getMonth()%2===1; while(+t<rangeEnd){ const next=LDT_Core.nextMonthStart(t); const x=xScale(+t); const w=xScale(+next)-x; if(isFinite(x)&&isFinite(w)){ const r=document.createElementNS("http://www.w3.org/2000/svg","rect"); r.setAttribute("x",x); r.setAttribute("y",0); r.setAttribute("width",w); r.setAttribute("height",(C.HEIGHT-78)); r.setAttribute("class","ld-month-bg"); r.setAttribute("fill-opacity", odd?"0.18":"0.045"); monthBg.appendChild(r);} t=next; odd=!odd; } }
    else { let t=LDT_Core.beginOfDay(new Date(rangeStart)); while(+t<rangeEnd){ if(LDT_Core.isWeekend(t)){ const dayEnd=LDT_Core.endOfDay(t); const x=xScale(Math.max(+t,rangeStart)); const w=xScale(Math.min(+dayEnd,rangeEnd))-x; if(isFinite(x)&&isFinite(w)){ const r=document.createElementNS("http://www.w3.org/2000/svg","rect"); r.setAttribute("x",x); r.setAttribute("y",0); r.setAttribute("width",w); r.setAttribute("height",(C.HEIGHT-78)); r.setAttribute("class","ld-weekend-bg"); r.setAttribute("fill-opacity","0.075"); weekendBg.appendChild(r);} } t=LDT_Core.addDays(t,1);} }
  }


  function renderPeriodBlocks(svg, rangeStart, rangeEnd){
    const g=svg.querySelector("#ld-period-blocks"); if(!g) return; g.innerHTML="";
    const topPad=C.TIMELINE_TOP_PAD || 58, monthH=C.PERIOD_MONTH_H || 20, weekH=C.PERIOD_WEEK_H || 18;
    const xScale=t=>((t-rangeStart)/(rangeEnd-rangeStart))*C.TL_W; if(!isFinite(xScale(rangeStart))) return;
    const mkText=(x,y,text,cls,anchor="start")=>{ const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute("x",x); t.setAttribute("y",y); t.setAttribute("class",cls||"ld-period-label"); t.setAttribute("text-anchor",anchor); t.textContent=text; g.appendChild(t); };
    let mi=0;
    for(let t=LDT_Core.monthStart(new Date(rangeStart)); +t<rangeEnd; t=LDT_Core.nextMonthStart(t), mi++){
      const next=LDT_Core.nextMonthStart(t), x=Math.max(0,xScale(+t)), w=Math.min(C.TL_W,xScale(+next))-x;
      if(!isFinite(x)||!isFinite(w)||w<=1) continue;
      const r=document.createElementNS("http://www.w3.org/2000/svg","rect"); r.setAttribute("x",x); r.setAttribute("y",0); r.setAttribute("width",w); r.setAttribute("height",monthH); r.setAttribute("class","ld-period-month-block"); r.setAttribute("fill-opacity", mi%2 ? "0.10" : "0.18"); g.appendChild(r);
      if(w>42) mkText(x+5,14,`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`,"ld-period-label ld-period-month-label");
    }
    let wi=0; const spanDays=(rangeEnd-rangeStart)/86400000;
    for(let t=LDT_Core.mondayOfWeek(new Date(rangeStart)); +t<rangeEnd; t=LDT_Core.addDays(t,7), wi++){
      const next=LDT_Core.addDays(t,7), x=Math.max(0,xScale(+t)), w=Math.min(C.TL_W,xScale(+next))-x;
      if(!isFinite(x)||!isFinite(w)||w<=1) continue;
      const r=document.createElementNS("http://www.w3.org/2000/svg","rect"); r.setAttribute("x",x); r.setAttribute("y",monthH+1); r.setAttribute("width",w); r.setAttribute("height",weekH); r.setAttribute("class","ld-period-week-block"); r.setAttribute("fill-opacity", wi%2 ? "0.12" : "0.06"); g.appendChild(r);
      if(spanDays<=45 && w>84){ ["M","T","W","T","F","S","S"].forEach((lab,i)=>mkText(x+(i+0.5)*w/7,monthH+14,lab,"ld-period-label ld-period-week-label","middle")); }
      else if(w>34){ mkText(x+5,monthH+14,`W${String(getISOWeek(t)).padStart(2,"0")}`,"ld-period-label ld-period-week-label"); }
    }
    const base=document.createElementNS("http://www.w3.org/2000/svg","line"); base.setAttribute("x1",0); base.setAttribute("x2",C.TL_W); base.setAttribute("y1",topPad-2); base.setAttribute("y2",topPad-2); base.setAttribute("class","ld-period-baseline"); g.appendChild(base);
    function getISOWeek(date){ const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())); const day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-day); const y0=new Date(Date.UTC(d.getUTCFullYear(),0,1)); return Math.ceil((((d-y0)/86400000)+1)/7); }
  }

  function renderLaneSeparators(svg, layout){
    const seps=svg.querySelector("#ld-lane-seps"); seps.innerHTML="";
    Array.from(new Set(Object.values(layout.ymap))).sort((a,b)=>a-b).forEach(y=>{
      const l=document.createElementNS("http://www.w3.org/2000/svg","line");
      l.setAttribute("x1",0); l.setAttribute("x2",C.TL_W); l.setAttribute("y1",y-1); l.setAttribute("y2",y-1); l.setAttribute("class","ld-lane-sep"); seps.appendChild(l);
    });
  }

  function renderRulers(svg, rangeStart, rangeEnd){
    const top=svg.querySelector("#ld-ruler-top"); const bottom=svg.querySelector("#ld-ruler-bottom"); top.innerHTML=""; bottom.innerHTML="";
    const rule=chooseTickStep(rangeStart, rangeEnd); const pts=buildTicks(rule, rangeStart, rangeEnd); const xScale=t=>((t-rangeStart)/(rangeEnd-rangeStart))*C.TL_W; if(!isFinite(xScale(rangeStart))) return;
    const mk=(group,y)=>{ const gg=document.createElementNS("http://www.w3.org/2000/svg","g"); gg.setAttribute("class","ld-grid"); group.appendChild(gg); pts.forEach(d=>{ const x=xScale(+d); if(!isFinite(x)) return; const l=document.createElementNS("http://www.w3.org/2000/svg","line"); l.setAttribute("x1",x); l.setAttribute("x2",x); l.setAttribute("y1",y); l.setAttribute("y2",(C.HEIGHT-78)-C.BOTTOM_RULER_H); gg.appendChild(l); const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute("x",x+3); t.setAttribute("y",y-6); t.textContent=fmtTick(rule,d); group.appendChild(t); }); };
    mk(top,C.TIMELINE_TOP_PAD || C.TOP_RULER_H);
    const gg=document.createElementNS("http://www.w3.org/2000/svg","g"); gg.setAttribute("class","ld-grid"); bottom.appendChild(gg);
    pts.forEach(d=>{ const x=xScale(+d); if(!isFinite(x)) return; const l=document.createElementNS("http://www.w3.org/2000/svg","line"); l.setAttribute("x1",x); l.setAttribute("x2",x); l.setAttribute("y1",C.TIMELINE_TOP_PAD || 0); l.setAttribute("y2",(C.HEIGHT-78)-C.BOTTOM_RULER_H); gg.appendChild(l); const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute("x",x+3); t.setAttribute("y",(C.HEIGHT-78)-6); t.textContent=fmtTick(rule,d); bottom.appendChild(t); });
  }


  function applyRenderSettings(){
    state.settings = LDT_Core.normalizeSettings(state.settings);
    document.documentElement.style.setProperty("--nd-outer-margin-x", state.settings.outerMarginX + "px");
    document.documentElement.style.setProperty("--nd-item-font-size", state.settings.fontSize + "px");
    document.documentElement.style.setProperty("--nd-item-font-weight", state.settings.fontWeight);
    const wrap=document.getElementById("ld-timeline-wrapper");
    if(wrap) wrap.style.marginLeft = wrap.style.marginRight = state.settings.outerMarginX + "px";
  }

  function populateTimeZoneSelect(){
    const sel=document.getElementById("ld-timezone-select");
    if(!sel) return;
    if(!sel.childElementCount){
      LDT_Core.DISPLAY_TIME_ZONES.forEach(z=>{ const opt=document.createElement("option"); opt.value=z.id; opt.textContent=z.label; sel.appendChild(opt); });
    }
    sel.value=state.displayTimeZone || "local";
  }
  function syncViewToggleButton(){
    const btn=document.querySelector('[data-act="toggle-view"] span');
    if(btn) btn.textContent = state.viewMode === "linear" ? LDT_Core.t(state.lang,"switchMonthGrid") : LDT_Core.t(state.lang,"switchLinear");
  }

  function approxTextWidth(text){
    const fs=(state.settings && state.settings.fontSize)||11; let n=0;
    for(const ch of String(text||"")) n += /[\u2E80-\u9FFF\uAC00-\uD7AF]/.test(ch) ? fs : fs*0.56;
    return n;
  }
  function selectedOrVisibleEvents(){
    const ids=state.selectedIds||new Set();
    const selected=state.events.filter(e=>ids.has(e.id));
    return selected.length ? selected : LDT_Core.visibleEventsInRange(state.events, state.rangeStart, state.rangeEnd);
  }
  function saveBlob(filename, text, type){
    const url=URL.createObjectURL(new Blob([text],{type:type||"text/plain;charset=utf-8"}));
    const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function exportSelectedICS(){
    const list=selectedOrVisibleEvents();
    if(!list.length){ alert(LDT_Core.t(state.lang, "noEventsExport")); return; }
    saveBlob("neatduck-timeline-events.ics", LDT_Core.eventsToICS(list, state.lang, state.pokemonDB), "text/calendar;charset=utf-8");
  }
  function emailSelectedLog(){
    const list=selectedOrVisibleEvents();
    if(!list.length){ alert(LDT_Core.t(state.lang, "noEmailEvents")); return; }
    const body=LDT_Core.eventsToTextLog(list, state.lang, state.pokemonDB);
    window.open("mailto:?subject="+encodeURIComponent("NeatDuck_Timeline Event Log")+"&body="+encodeURIComponent(body), "_blank");
  }
  function refreshRemoteData(showAlert){
    if(!(typeof chrome!=="undefined" && chrome.runtime && chrome.runtime.sendMessage)) return Promise.resolve(null);
    return new Promise(resolve=>{
      try{ chrome.runtime.sendMessage({type:"nd_refresh_remote_events"}, resp=>{
        if(chrome.runtime.lastError){ if(showAlert) alert(LDT_Core.t(state.lang, "remoteFail") + chrome.runtime.lastError.message); resolve(null); return; }
        if(showAlert) alert(resp && resp.ok ? LDT_Core.t(state.lang, "remoteSuccess") : (LDT_Core.t(state.lang, "remoteFail") + ((resp && resp.error) || "未知错误")));
        resolve(resp||null);
      }); }catch(err){ if(showAlert) alert(LDT_Core.t(state.lang, "remoteFail") + err.message); resolve(null); }
    });
  }
  function buildSettingsModal(){
    const modal=document.getElementById("ld-settings-modal"), body=document.getElementById("ld-settings-body"), mask=document.getElementById("ld-mask");
    if(!modal||!body||!mask) return;
    const cfg=LDT_Core.normalizeSettings(state.settings);
    const t=(key)=>LDT_Core.t(state.lang, key);
    const row=(key,labelKey,type="number",extra="")=>`<tr><td>${LDT_Core.escapeHTML(t(labelKey))}</td><td><input data-setting="${key}" type="${type}" value="${LDT_Core.escapeHTML(cfg[key])}" ${extra}></td></tr>`;
    body.innerHTML=`<table><tbody>
      ${row("outerMarginX","settingsOuterMarginX","number",'min="0" max="80" step="1"')}
      ${row("labelPaddingX","settingsLabelPaddingX","number",'min="0" max="24" step="1"')}
      ${row("itemBorderWidth","settingsItemBorderWidth","number",'min="0" max="6" step="0.5"')}
      ${row("itemRadius","settingsItemRadius","number",'min="0" max="16" step="1"')}
      ${row("hoverPersistMs","settingsHoverPersistMs","number",'min="300" max="12000" step="100"')}
      ${row("fontSize","settingsFontSize","number",'min="8" max="20" step="1"')}
      ${row("fontWeight","settingsFontWeight","number",'min="300" max="900" step="100"')}
      ${row("minShortEventWidth","settingsMinShortEventWidth","number",'min="4" max="120" step="1"')}
      ${row("shadeMaxWidth","settingsShadeMaxWidth","number",'min="0" max="420" step="5"')}
      ${row("shadeGap","settingsShadeGap","number",'min="0" max="20" step="1"')}
      <tr><td>${LDT_Core.escapeHTML(t("settingsLabelOutline"))}</td><td><label><input data-setting="labelOutline" type="checkbox" ${cfg.labelOutline?"checked":""}> ${LDT_Core.escapeHTML(t("settingsEnable"))}</label></td></tr>
      <tr><td>${LDT_Core.escapeHTML(t("settingsRemoteUrl"))}</td><td><input data-setting="remoteUrl" type="url" value="${LDT_Core.escapeHTML(state.remoteUrl || LDT_Core.DEFAULT_REMOTE_URL)}" style="width:100%"></td></tr>
    </tbody></table><p style="font-size:12px;color:#667085;margin:8px 0 0">${LDT_Core.escapeHTML(t("settingsHint"))}</p>`;
    mask.style.display="block"; modal.style.display="block";
    const save=async()=>{
      const next={};
      body.querySelectorAll("[data-setting]").forEach(input=>{
        const key=input.getAttribute("data-setting");
        if(key==="remoteUrl") return;
        next[key]=input.type==="checkbox" ? input.checked : Number(input.value);
      });
      state.settings=LDT_Core.normalizeSettings(next);
      state.remoteUrl=LDT_Core.normalizeRemoteUrl((body.querySelector('[data-setting="remoteUrl"]')||{}).value || LDT_Core.DEFAULT_REMOTE_URL);
      await LDT_Core.saveState({ld_settings:state.settings, ld_remote_url:state.remoteUrl});
      applyRenderSettings(); updateViewMode();
    };
    const saveBtn=modal.querySelector('[data-save="settings"]'); if(saveBtn) saveBtn.onclick=save;
  }

  function addLabelWithCrispHalo(group, makeText, textValue, useHalo){
    if (useHalo){
      const offsets = [[-0.85,0],[0.85,0],[0,-0.85],[0,0.85]];
      for (const [dx,dy] of offsets){
        const h = makeText();
        h.setAttribute("fill", "#ffffff");
        h.setAttribute("stroke", "none");
        h.setAttribute("opacity", "0.96");
        h.setAttribute("pointer-events", "none");
        h.setAttribute("transform", `translate(${dx} ${dy})`);
        h.textContent = textValue;
        group.appendChild(h);
      }
    }
    const label = makeText();
    label.setAttribute("fill", useHalo ? "#111111" : "#111111");
    label.setAttribute("stroke", "none");
    label.textContent = textValue;
    group.appendChild(label);
    return label;
  }

  function renderItems(svg, events, colors, layout, rangeStart, rangeEnd){
    const g=svg.querySelector("#ld-items"); g.innerHTML="";
    const ext=document.getElementById("ld-extenders"); if(ext) ext.innerHTML="";
    const xScale=t=>((t-rangeStart)/(rangeEnd-rangeStart))*C.TL_W; if(!isFinite(xScale(rangeStart))) return;
    const cfg=LDT_Core.normalizeSettings(state.settings), pad=cfg.labelPaddingX, minW=cfg.minShortEventWidth;
    const map={};
    events.forEach(e=>{ const sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone); if(!isFinite(sMs)||!isFinite(eMs)) return; const key=`${e.lane}::${e.sub}`; (map[key]=map[key]||[]).push(e); });
    Object.values(map).forEach(a=>a.sort((x,y)=>LDT_Core.eventStartMs(x,state.displayTimeZone)-LDT_Core.eventStartMs(y,state.displayTimeZone)));
    for(const key of Object.keys(map)){
      const arr=map[key];
      for(let i=0;i<arr.length;i++){
        const e=arr[i], sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone); if(!isFinite(sMs)||!isFinite(eMs)) continue;
        const x1=xScale(sMs), x2=xScale(eMs); if(!isFinite(x1)||!isFinite(x2)) continue;
        const y=layout.ymap[`${e.lane}::${e.sub}`] || layout.ymap[`${e.lane}::${e.lane}`]; if(y==null) continue;
        const actualW=Math.max(0,x2-x1), fixed=LDT_Core.isFixedTimeEvent(e);
        const isShort=["Max Mondays","Raid Hour","Pokémon Spotlight Hour"].includes(e.sub) || (actualW>0 && actualW<minW);
        const blockW=Math.max(isShort?minW:2, actualW);
        const fill=colors[e.sub]||colors[e.category]||colors[e.lane]||"lightsteelblue";
        const next=arr[i+1], nextStart=next?LDT_Core.eventStartMs(next,state.displayTimeZone):NaN, nextX=isFinite(nextStart)?xScale(nextStart):Infinity;
        const nextLimit=Math.min(C.TL_W, isFinite(nextX)?nextX-cfg.shadeGap:C.TL_W);
        const rawTitle=LDT_Core.localizeEventTitle(e, state.lang, state.pokemonDB).trim();
        const desiredW=approxTextWidth(rawTitle)+pad*2, baseEnd=Math.max(x2,x1+blockW), visibleStart=Math.max(0,x1), visibleBaseEnd=Math.min(C.TL_W,baseEnd);
        let labelBoxEnd=visibleBaseEnd, shade=null;
        if(desiredW>Math.max(0,visibleBaseEnd-visibleStart) && cfg.shadeMaxWidth>0){
          labelBoxEnd=Math.min(nextLimit, visibleStart+Math.min(desiredW,(visibleBaseEnd-visibleStart)+cfg.shadeMaxWidth));
          if(labelBoxEnd>visibleBaseEnd+1){ shade=document.createElementNS("http://www.w3.org/2000/svg","rect"); shade.setAttribute("x",visibleBaseEnd); shade.setAttribute("y",y); shade.setAttribute("width",labelBoxEnd-visibleBaseEnd); shade.setAttribute("height",C.ITEM_H); shade.setAttribute("rx",cfg.itemRadius); shade.setAttribute("ry",cfg.itemRadius); shade.setAttribute("fill",fill); shade.setAttribute("fill-opacity","0.50"); shade.setAttribute("class","ld-item-shade"); g.appendChild(shade); }
        }
        const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
        r.setAttribute("x",x1); r.setAttribute("y",y); r.setAttribute("width",blockW); r.setAttribute("height",C.ITEM_H); r.setAttribute("rx",cfg.itemRadius); r.setAttribute("ry",cfg.itemRadius); r.setAttribute("fill",fill); r.setAttribute("stroke-width",fixed?Math.max(cfg.itemBorderWidth+1,2.25):cfg.itemBorderWidth); r.setAttribute("class","ld-item"+(fixed?" fixed-tz":"")+(!e.endKnown?" inferred":"")+(state.selectedIds && state.selectedIds.has(e.id)?" selected":"")); g.appendChild(r);
        const visX1=Math.max(0,x1), visX2=Math.min(C.TL_W,Math.max(labelBoxEnd,visibleBaseEnd)), visW=Math.max(0,visX2-visX1);
        if(visW>6){
          const makeText=()=>{ const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute("x",visX1+pad); t.setAttribute("y",y+C.ITEM_H/2+Math.round(cfg.fontSize*0.36)); t.setAttribute("font-size",cfg.fontSize); t.setAttribute("font-weight",cfg.fontWeight); return t; };
          let label=rawTitle; const allow=Math.max(0,visW-pad*2);
          if(approxTextWidth(label)>allow){ let lo=0,hi=label.length; while(lo<hi){ const mid=Math.floor((lo+hi+1)/2), probe=label.slice(0,mid)+"…"; if(approxTextWidth(probe)<=allow) lo=mid; else hi=mid-1; } label=label.slice(0,lo)+(lo<rawTitle.length?"…":""); }
          const text = addLabelWithCrispHalo(g, makeText, label, cfg.labelOutline);
          if(!cfg.labelOutline) text.setAttribute("fill", LDT_Core.contrastTextColor(fill));
          text.addEventListener("click",ev=>{ev.stopPropagation(); toggleSelect(e.id);});
        }
        [r,shade].filter(Boolean).forEach(node=>{ node.addEventListener("click",ev=>{ev.stopPropagation(); toggleSelect(e.id);}); node.addEventListener("mouseenter",()=>node.setAttribute("stroke-width",Math.max(cfg.itemBorderWidth,fixed?3:2))); node.addEventListener("mouseleave",()=>node.setAttribute("stroke-width",fixed?Math.max(cfg.itemBorderWidth+1,2.25):cfg.itemBorderWidth)); node.setAttribute("title", LDT_Core.formatEventRange(e,state.displayTimeZone)); });
      }
    }
  }

  function toggleSelect(id){
    if(!id) return;
    if(!state.selectedIds) state.selectedIds=new Set();
    if(state.selectedIds.has(id)) state.selectedIds.delete(id); else state.selectedIds.add(id);
    updateViewMode();
  }

  function renderNowLine(svg, rangeStart, rangeEnd){
    const line=svg.querySelector("#ld-now line"); const xScale=t=>((t-rangeStart)/(rangeEnd-rangeStart))*C.TL_W; const nowX=xScale(Date.now());
    if(isFinite(nowX)){ line.setAttribute("x1",nowX); line.setAttribute("x2",nowX); }
  }

  function renderLinear(){
    const svg=document.getElementById("ld-timeline-svg");
    const layout=laneLayout();
    renderLegend(layout); renderBackground(svg, state.rangeStart, state.rangeEnd); renderPeriodBlocks(svg, state.rangeStart, state.rangeEnd); renderLaneSeparators(svg, layout); renderRulers(svg, state.rangeStart, state.rangeEnd); renderItems(svg, state.events, state.colors, layout, state.rangeStart, state.rangeEnd); renderNowLine(svg, state.rangeStart, state.rangeEnd);
  }

  function renderMonthGrid(){
    const mg=document.getElementById("ld-monthgrid"); const svg=document.getElementById("ld-timeline-svg");
    mg.style.display="block"; svg.style.display="none"; mg.innerHTML=""; mg.className="nd-monthgrid"; mg.style.position="relative"; mg.style.height=(C.HEIGHT-78)+"px"; mg.style.overflowY="auto"; mg.style.width=C.TL_W+"px";
    const colW=C.TL_W/7, baseMon=LDT_Core.mondayOfWeek(new Date(state.rangeStart)), endLimit=LDT_Core.addDays(LDT_Core.mondayOfWeek(new Date(state.rangeEnd)),7), weeks=[];
    for(let t=baseMon; +t<+endLimit; t=LDT_Core.addDays(t,7)) weeks.push({start:new Date(t), end:LDT_Core.addDays(t,7)});
    const dow=["M","T","W","T","F","S","S"], nowDay=LDT_Core.beginOfDay(new Date()), colors=state.colors;
    function timeText(e){ const ss=LDT_Core.eventDisplayDate(e,"start",state.displayTimeZone), ee=LDT_Core.eventDisplayDate(e,"endKnown",state.displayTimeZone)||LDT_Core.eventDisplayDate(e,"endInferred",state.displayTimeZone); if(!ss||!ee) return ""; const pad=n=>String(n).padStart(2,"0"); if(ss.getHours()===0&&ss.getMinutes()===0&&ee.getHours()>=23) return ""; return `${pad(ss.getHours())}:${pad(ss.getMinutes())}-${pad(ee.getHours())}:${pad(ee.getMinutes())}`; }
    weeks.forEach(week=>{
      const events=(state.events||[]).filter(e=>{ const sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone); return isFinite(sMs)&&isFinite(eMs)&&eMs>=+week.start&&sMs<+week.end; }).sort((a,b)=>{ const da=LDT_Core.eventEndMs(a,state.displayTimeZone)-LDT_Core.eventStartMs(a,state.displayTimeZone), db=LDT_Core.eventEndMs(b,state.displayTimeZone)-LDT_Core.eventStartMs(b,state.displayTimeZone); return (db-da)||(LDT_Core.eventStartMs(a,state.displayTimeZone)-LDT_Core.eventStartMs(b,state.displayTimeZone)); });
      const shown=events.slice(0,9), rowH=34+Math.max(4,shown.length)*21+(events.length>shown.length?18:0), row=document.createElement("div"); row.className="week-row"; row.style.position="relative"; row.style.height=rowH+"px"; mg.appendChild(row);
      for(let i=0;i<7;i++){ const d=LDT_Core.addDays(week.start,i), dayStart=LDT_Core.beginOfDay(d), day=document.createElement("div"); day.className="nd-month-day"; day.style.left=(i*colW)+"px"; day.style.width=colW+"px"; if(+dayStart===+nowDay) day.classList.add("today"); row.appendChild(day); const lab=document.createElement("div"); lab.className="nd-month-label"; lab.style.left=(i*colW+4)+"px"; lab.textContent=`${dow[i]} ${d.getMonth()+1}/${d.getDate()}`; row.appendChild(lab); }
      shown.forEach((e,idx)=>{ const sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone), left=Math.max(0,Math.min(7,(sMs-+week.start)/86400000))*colW+2, right=Math.max(0,Math.min(7,(eMs-+week.start)/86400000))*colW-2, width=Math.max(18,right-left), fill=colors[e.sub]||colors[e.category]||colors[e.lane]||"lightsteelblue", div=document.createElement("div"); div.className="nd-month-event"+(LDT_Core.isFixedTimeEvent(e)?" fixed-tz":""); div.style.left=left+"px"; div.style.top=(28+idx*21)+"px"; div.style.width=width+"px"; div.style.background=fill; div.style.color=LDT_Core.contrastTextColor(fill); const tt=timeText(e); div.textContent=(tt?tt+" ":"")+LDT_Core.localizeEventTitle(e,state.lang,state.pokemonDB); div.title=LDT_Core.formatEventRange(e,state.displayTimeZone); div.addEventListener("click",ev=>{ ev.stopPropagation(); toggleSelect(e.id); }); row.appendChild(div); });
      if(events.length>shown.length){ const more=document.createElement("div"); more.className="nd-month-more"; more.style.top=(28+shown.length*21)+"px"; more.textContent=`+${events.length-shown.length} more`; row.appendChild(more); }
    });
  }

  function updateViewMode(){
    const svg=document.getElementById("ld-timeline-svg"); const mg=document.getElementById("ld-monthgrid");
    syncViewToggleButton();
    if(state.viewMode==="linear"){ svg.style.display="block"; mg.style.display="none"; renderLinear(); } else renderMonthGrid();
  }

  function fitRangeToEvents(){
    const vals=(state.events||[]).map(e=>({s:LDT_Core.eventStartMs(e,state.displayTimeZone), e:LDT_Core.eventEndMs(e,state.displayTimeZone)})).filter(x=>isFinite(x.s)&&isFinite(x.e));
    if(vals.length){ const min=Math.min(...vals.map(x=>x.s)); const max=Math.max(...vals.map(x=>x.e)); state.rangeStart=+LDT_Core.addDays(min,-2); state.rangeEnd=+LDT_Core.addDays(max,5); }
    else { const now=Date.now(); state.rangeStart=+LDT_Core.addDays(now,-2); state.rangeEnd=+LDT_Core.addDays(now,5); }
  }

  function attachInteractions(){
    const stage=document.getElementById("ld-right"); if(!stage || stage.__ldtBound) return; stage.__ldtBound=true;
    let dragging=false,lastX=0;
    stage.addEventListener("mousedown", ev=>{ if(state.viewMode!=="linear" || ev.button!==0) return; dragging=true; lastX=ev.clientX; stage.style.cursor="grabbing"; ev.preventDefault(); });
    window.addEventListener("mouseup", ()=>{ dragging=false; stage.style.cursor=""; });
    window.addEventListener("mousemove", ev=>{ if(!dragging || state.viewMode!=="linear") return; const dx=ev.clientX-lastX; lastX=ev.clientX; const span=state.rangeEnd-state.rangeStart; const delta=(dx/C.TL_W)*span; state.rangeStart-=delta; state.rangeEnd-=delta; updateViewMode(); });
    stage.addEventListener("wheel", ev=>{ if(state.viewMode!=="linear") return; ev.preventDefault(); const rect=stage.getBoundingClientRect(); const x=Math.max(0, Math.min(C.TL_W, (ev.clientX-rect.left)*(C.TL_W/Math.max(1,rect.width)))); const span=state.rangeEnd-state.rangeStart; const center=state.rangeStart+(x/C.TL_W)*span; const factor=ev.deltaY<0?0.82:1.22; const newSpan=Math.max(6*3600000, Math.min(240*86400000, span*factor)); const ratio=x/C.TL_W; state.rangeStart=center-ratio*newSpan; state.rangeEnd=state.rangeStart+newSpan; updateViewMode(); }, {passive:false});
  }

  function showStandaloneMessage(message){
    const svg=document.getElementById("ld-timeline-svg");
    if(!svg) return;
    ["#ld-month-bgs","#ld-weekend-bgs","#ld-period-blocks","#ld-ruler-top","#ld-ruler-bottom","#ld-lane-seps","#ld-items"].forEach(sel=>{ const el=svg.querySelector(sel); if(el) el.innerHTML=""; });
    const g=svg.querySelector("#ld-items");
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x", 36);
    t.setAttribute("y", 84);
    t.setAttribute("fill", "#444");
    t.setAttribute("font-size", "16");
    t.textContent = message;
    g.appendChild(t);
  }

  async function loadAndRenderFromStorage(opts={}){
    const preserveRange = !!opts.preserveRange;
    const hasChromeApi = typeof chrome !== "undefined" && chrome.storage && chrome.runtime;
    if(!hasChromeApi){
      showStandaloneMessage("请从扩展按钮或 LeekDuck 页面打开独立页；直接双击 standalone.html 没有 chrome.storage 权限。");
      return;
    }
    const st=await LDT_Core.loadState();
    state.lang=st.lang||state.lang; state.displayTimeZone=st.displayTimeZone||state.displayTimeZone||"local"; applyI18n(); populateTimeZoneSelect(); state.colors=st.colors||state.colors; state.settings=LDT_Core.normalizeSettings(st.settings); state.detailsCache=st.detailsCache||{}; state.remoteUrl=LDT_Core.normalizeRemoteUrl(st.remoteUrl); applyRenderSettings();
    if(!state.pokemonDB){
      try{
        const res = await fetch(chrome.runtime.getURL("assets/pokemon.json"));
        const txt = await res.text();
        state.pokemonDB = txt.trim() ? JSON.parse(txt) : {rows:[]};
      }catch(e){ state.pokemonDB = {rows:[]}; console.warn("pokemon.json unavailable", e); }
    }
    let csv = st.eventsCsv || "";
    if(!csv){
      try{
        const res = await fetch(chrome.runtime.getURL("data/events.csv"));
        const txt = await res.text();
        if (txt && txt.split(/\r?\n/).filter(x=>x.trim()).length > 1) csv = txt;
      }catch(e){ console.warn("bundled data/events.csv unavailable", e); }
    }
    state.events = (st.events && st.events.length) ? LDT_Core.dedupeEvents(st.events) : (csv ? LDT_Core.dedupeEvents(LDT_Core.csvToEvents(csv)) : []);
    LDT_Core.assignThemeRows(state.events);
    if(!preserveRange || !state.rangeStart || !state.rangeEnd) fitRangeToEvents();
    updateViewMode();
    if(!state.events.length){
      showStandaloneMessage(LDT_Core.t(state.lang, "noCachedEvents"));
    }
  }

  function attachStorageListener(){
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.onChanged || attachStorageListener.bound) return;
    attachStorageListener.bound = true;
    let timer=null;
    chrome.storage.onChanged.addListener((changes, areaName)=>{
      if(areaName !== "local") return;
      const keys = ["ld_events_csv_text","ld_events_history_csv_text","ld_events_cache","ld_events_history_cache","ld_events_fingerprint","ld_events_live_ids","ldt_events","ld_colors","ld_lang","ldt_saved_at","ld_last_scan_at","ld_settings","ld_remote_events_csv_text","ld_remote_last_fetch_at","ld_remote_url"];
      if(!keys.some(k => Object.prototype.hasOwnProperty.call(changes,k))) return;
      clearTimeout(timer);
      timer=setTimeout(()=>loadAndRenderFromStorage({preserveRange:false}), 80);
    });
  }

  async function init(){
    attachStorageListener();
    await refreshRemoteData(false);
    await loadAndRenderFromStorage({preserveRange:false});
    const exportBtn = document.querySelector('[data-act="export-events-csv"]');
    if(exportBtn && !exportBtn.__ldtBound) exportBtn.addEventListener("click", ()=>{
      const text=LDT_Core.eventsToCSV(state.events); const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"})); const a=document.createElement("a"); a.href=url; a.download="neatduck-timeline-events.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
    if(exportBtn) exportBtn.__ldtBound = true;
    const settingsBtn = document.querySelector('[data-act="settings"]');
    if(settingsBtn && !settingsBtn.__ldtBound) settingsBtn.addEventListener("click", buildSettingsModal);
    if(settingsBtn) settingsBtn.__ldtBound = true;
    const remoteBtn = document.querySelector('[data-act="remote-update"]');
    if(remoteBtn && !remoteBtn.__ldtBound) remoteBtn.addEventListener("click", async ()=>{ const resp=await refreshRemoteData(true); if(resp && resp.ok) await loadAndRenderFromStorage({preserveRange:true}); });
    if(remoteBtn) remoteBtn.__ldtBound = true;
    const icsBtn = document.querySelector('[data-act="export-ics"]');
    if(icsBtn && !icsBtn.__ldtBound) icsBtn.addEventListener("click", exportSelectedICS);
    if(icsBtn) icsBtn.__ldtBound = true;
    const emailBtn = document.querySelector('[data-act="email-log"]');
    if(emailBtn && !emailBtn.__ldtBound) emailBtn.addEventListener("click", emailSelectedLog);
    if(emailBtn) emailBtn.__ldtBound = true;
    const clearBtn = document.querySelector('[data-act="clear-selection"]');
    if(clearBtn && !clearBtn.__ldtBound) clearBtn.addEventListener("click", ()=>{ state.selectedIds.clear(); updateViewMode(); });
    if(clearBtn) clearBtn.__ldtBound = true;
    const mask=document.getElementById("ld-mask");
    if(mask && !mask.__ndBound){ mask.addEventListener("click",()=>{ document.querySelectorAll(".ld-modal").forEach(m=>m.style.display="none"); mask.style.display="none"; }); mask.__ndBound=true; }
    document.querySelectorAll("[data-close='settings']").forEach(b=>{ if(!b.__ndBound){ b.addEventListener("click",()=>{ document.getElementById("ld-settings-modal").style.display="none"; document.getElementById("ld-mask").style.display="none"; }); b.__ndBound=true; } });
    const tzSel=document.getElementById("ld-timezone-select");
    if(tzSel && !tzSel.__ldtBound) tzSel.addEventListener("change", async ()=>{ state.displayTimeZone=tzSel.value||"local"; await LDT_Core.saveState({ld_display_timezone:state.displayTimeZone}); updateViewMode(); });
    if(tzSel) tzSel.__ldtBound = true;
    const todayBtn = document.querySelector('[data-act="today"]');
    if(todayBtn && !todayBtn.__ldtBound) todayBtn.addEventListener("click", ()=>{ const span=state.rangeEnd-state.rangeStart; if(isFinite(span) && span>0){ state.rangeStart=Date.now()-span*0.25; state.rangeEnd=state.rangeStart+span; updateViewMode(); } });
    if(todayBtn) todayBtn.__ldtBound = true;
    const weekBtn = document.querySelector('[data-act="reset-week"]');
    if(weekBtn && !weekBtn.__ldtBound) weekBtn.addEventListener("click", ()=>{ const now=Date.now(); state.rangeStart=+LDT_Core.addDays(now,-2); state.rangeEnd=+LDT_Core.addDays(now,5); updateViewMode(); });
    if(weekBtn) weekBtn.__ldtBound = true;
    const monthBtn = document.querySelector('[data-act="reset-month"]');
    if(monthBtn && !monthBtn.__ldtBound) monthBtn.addEventListener("click", ()=>{ const now=Date.now(); state.rangeStart=+LDT_Core.addDays(now,-7); state.rangeEnd=+LDT_Core.addDays(now,31); updateViewMode(); });
    if(monthBtn) monthBtn.__ldtBound = true;
    const toggleBtn = document.querySelector('[data-act="toggle-view"]');
    if(toggleBtn && !toggleBtn.__ldtBound) toggleBtn.addEventListener("click", ()=>{ state.viewMode=state.viewMode==="linear"?"month":"linear"; updateViewMode(); });
    if(toggleBtn) toggleBtn.__ldtBound = true;
    LDT_Core.initInfoPages({state, updateViewMode, getDataUrl:(p)=>chrome.runtime.getURL(p)});
    attachInteractions();
  }
  if (document.readyState==="complete" || document.readyState==="interactive") init(); else window.addEventListener("DOMContentLoaded", init);
})();
