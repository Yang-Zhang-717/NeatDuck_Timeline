// == content.js v1.0.5 ==
(function(){
  const C = LDT_Core.CONST;
  const I18N = LDT_Core.I18N;
  const DEFAULT_LANG = LDT_Core.DEFAULT_LANG;
  const LANES_SPEC = LDT_Core.LANES_SPEC;
  const DEFAULT_COLORS = LDT_Core.DEFAULT_COLORS;

  const WRAP_ID  = "ld-timeline-wrapper";
  const SVG_ID   = "ld-timeline-svg";
  const LEGEND_ID= "ld-legend-svg";

  let state={ lang:DEFAULT_LANG, colors:{...DEFAULT_COLORS}, settings:LDT_Core.normalizeSettings({}), events:[], rangeStart:null, rangeEnd:null,
              viewMode:"linear", displayTimeZone:"local", isDragging:false, dragStartX:0, dragStartRangeStart:0, dragStartRangeEnd:0, csvText:"", pokemonDB:null, detailsCache:{}, selectedIds:new Set(), remoteUrl:LDT_Core.DEFAULT_REMOTE_URL };

  function insertUIRoot(){
    if (document.getElementById(WRAP_ID)) return document.getElementById(WRAP_ID);
    const h = Array.from(document.querySelectorAll("h1, h2")).find(x=>/events/i.test(x.textContent||""));
    if (!h) return null;
    const wrap=document.createElement("div"); wrap.id=WRAP_ID;
    wrap.innerHTML = `
      <div id="ld-topbar">
        <div class="row">
          <button class="btn nd-tab active" data-nd-tab="timeline"><span data-i18n="tabTimeline">Activity Timeline</span></button>
          <button class="btn nd-tab" data-nd-tab="types"><span data-i18n="tabTypes">Type Matchups</span></button>
          <button class="btn nd-tab" data-nd-tab="pokedex"><span data-i18n="tabPokedex">Pokédex</span></button>
          <button class="btn nd-tab" data-nd-tab="max"><span data-i18n="tabMax">Dynamax/Gigantamax</span></button>
          <button class="btn" data-act="today">🎯 <span data-i18n="today">Today</span></button>
          <button class="btn" data-act="reset-week">📆 <span data-i18n="resetWeek">This Week</span></button>
          <button class="btn" data-act="reset-month">🗓️ <span data-i18n="resetMonth">This Month</span></button>
          <button class="btn" data-act="toggle-view">↔️ <span data-i18n="toggleView">Toggle View</span></button>
          <button class="btn" data-act="open-standalone">🧭 <span data-i18n="openStandalone">Open standalone</span></button>
          <button class="btn" data-act="remote-update">☁️ <span data-i18n="remoteUpdate">Cloud Update</span></button>
          <button class="btn" data-act="rescan">🔄 <span data-i18n="dataUpdate">Page Scan</span></button>
        </div>
        <div class="row">
          <select class="btn" id="ld-lang-select" title="Language">
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
          <label class="nd-inline-label"><span data-i18n="timezone">Time Zone</span>
            <select class="btn" id="ld-timezone-select"></select>
          </label>
          <button class="btn" data-act="settings">⚙️ <span data-i18n="settings">Settings</span></button>
          <button class="btn" data-act="colors">🎨 <span data-i18n="colors">Colors</span></button>
          <button class="btn" data-act="export-events-csv">📤 <span data-i18n="exportCSVEvents">Export Events CSV</span></button>
          <button class="btn" data-act="export-ics">🗓️ <span data-i18n="exportICS">Export ICS</span></button>
          <button class="btn" data-act="email-log">📨 <span data-i18n="emailLog">Email Log</span></button>
          <button class="btn" data-act="clear-selection">🧹 <span data-i18n="clearSelection">Clear Selection</span></button>
        </div>
      </div>
      <div id="ld-left"><svg id="${LEGEND_ID}" viewBox="0 0 ${C.LEGEND_W} ${C.HEIGHT-78}" preserveAspectRatio="xMinYMin"></svg></div>
      <div id="ld-right">
        <svg id="${SVG_ID}" viewBox="0 0 ${C.TL_W} ${C.HEIGHT-78}" preserveAspectRatio="xMinYMin">
          <g id="ld-month-bgs"></g>
          <g id="ld-weekend-bgs"></g>
          <g id="ld-period-blocks"></g>
          <g id="ld-ruler-top" class="ld-ruler"></g>
          <g id="ld-ruler-bottom" class="ld-ruler"></g>
          <g id="ld-lane-seps"></g>
          <g id="ld-items"></g>
          <g id="ld-now"><line class="ld-now" y1="0" y2="${C.HEIGHT-78}"/></g>
        </svg>
        <div id="ld-extenders"></div>
        <div id="ld-monthgrid" style="display:none;"></div>
      </div>
      <div class="ld-modal-mask" id="ld-mask"></div>
      <div class="ld-modal" id="ld-colors-modal"><h3 data-i18n="editingColors">Editing category colors</h3><div id="ld-colors-rows"></div><div class="footer"><button class="btn" data-close="colors">OK</button></div></div>
      <div class="ld-modal" id="ld-settings-modal"><h3 data-i18n="settings">Settings</h3><div id="ld-settings-body"></div><div class="footer"><button class="btn" data-save="settings"><span data-i18n="apply">Apply</span></button><button class="btn" data-close="settings">OK</button></div></div>
      <div class="ld-modal" id="ld-updates-modal"><h3 data-i18n="updates">Updates detected</h3><div id="ld-updates-body"></div><div class="footer"><button class="btn" data-apply="updates"><span data-i18n="apply">Apply</span></button><button class="btn" data-close="updates"><span data-i18n="ignore">Ignore</span></button></div></div>
    `;
    h.insertAdjacentElement("afterend", wrap);
    return wrap;
  }

  function laneLayout(){
    let y=C.TIMELINE_TOP_PAD || 58; const map={}, laneTops={};
    for (const lane of LANES_SPEC){
      if (lane.sub && lane.sub.length){
        for (const sub of lane.sub){
          map[`${lane.key}::${sub}`]=y; y += C.ITEM_H + C.ITEM_GAP;
        }
      } else {
        map[`${lane.key}::${lane.key}`]=y; y += C.ITEM_H + C.ITEM_GAP;
      }
      y += C.GROUP_GAP;
    }
    return { ymap: map, contentBottom: y + 10 };
  }

  function renderLegend(layout){
    const svg = document.getElementById("ld-legend-svg");
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const g=document.createElementNS("http://www.w3.org/2000/svg","g"); svg.appendChild(g);
    const sepYs = Array.from(new Set(Object.values(layout.ymap))).sort((a,b)=>a-b);
    sepYs.forEach(y=>{
      const line=document.createElementNS("http://www.w3.org/2000/svg","line");
      line.setAttribute("x1",0); line.setAttribute("x2",C.LEGEND_W); line.setAttribute("y1",y-1); line.setAttribute("y2",y-1);
      line.setAttribute("class","ld-legend-sep"); g.appendChild(line);
    });
    for (const lane of LANES_SPEC){
      if (lane.sub && lane.sub.length){
        for (const sub of lane.sub){
          const y = layout.ymap[`${lane.key}::${sub}`];
          const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
          rect.setAttribute("x", 8); rect.setAttribute("y", y); rect.setAttribute("width", 12); rect.setAttribute("height", C.ITEM_H);
          rect.setAttribute("class","legend-band"); rect.style.fill = state.colors[sub] || LDT_Core.hashColor(sub); g.appendChild(rect);
          const text=document.createElementNS("http://www.w3.org/2000/svg","text");
          text.setAttribute("x", 28); text.setAttribute("y", y + C.ITEM_H/2); text.setAttribute("class","legend-label"); text.textContent=LDT_Core.localizeCategoryLabel(sub, state.lang); g.appendChild(text);
        }
      } else {
        const y = layout.ymap[`${lane.key}::${lane.key}`];
        const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
        rect.setAttribute("x", 8); rect.setAttribute("y", y); rect.setAttribute("width", 12); rect.setAttribute("height", C.ITEM_H);
        rect.setAttribute("class","legend-band"); rect.style.fill = state.colors[lane.key] || "#999999"; g.appendChild(rect);
        const text=document.createElementNS("http://www.w3.org/2000/svg","text");
        text.setAttribute("x", 28); text.setAttribute("y", y + C.ITEM_H/2); text.setAttribute("class","legend-label"); text.textContent=lane.title; g.appendChild(text);
      }
    }
  }

  function chooseTickStep(rangeStart, rangeEnd){
    const spanMs = rangeEnd - rangeStart;
    function countTicks(rule){
      if (rule.type==="hour"){ const stepMs=rule.step*3600000; return Math.floor(spanMs/stepMs)+1; }
      if (rule.type==="day"){ const stepMs=rule.step*86400000; return Math.floor(spanMs/stepMs)+1; }
      if (rule.type==="weekMon"){ let c=0; let t=new Date(rangeStart); t=LDT_Core.mondayOfWeek(t); while (t<=rangeEnd){ c++; t=LDT_Core.addDays(t,7*rule.step);} return c; }
      if (rule.type==="month1"){ let c=0; let t=LDT_Core.monthStart(new Date(rangeStart)); while (t<=rangeEnd){ c++; t=LDT_Core.nextMonthStart(t);} return c; }
      return 5;
    }
    const TICK_RULES = [
      { type: "hour", step: 1 },{ type: "hour", step: 3 },
      { type: "hour", step: 6 },{ type: "day",  step: 1 },
      { type: "day",  step: 2 },{ type: "weekMon", step: 1 },{ type: "weekMon", step: 2 },{ type: "month1", step: 1 }
    ];
    for (const r of TICK_RULES){ const c=countTicks(r); if (c<=13) return r; }
    return TICK_RULES[TICK_RULES.length-1];
  }

  function buildTicks(rule, rangeStart, rangeEnd){
    const out=[];
    if (rule.type==="hour"){ const stepMs=rule.step*3600000; const t0=new Date(rangeStart); t0.setMinutes(0,0,0); let t=new Date(t0); while (+t<=rangeEnd){ out.push(new Date(t)); t=new Date(+t+stepMs);} }
    else if (rule.type==="day"){ const stepMs=rule.step*86400000; const t0=LDT_Core.beginOfDay(new Date(rangeStart)); let t=new Date(t0); while (+t<=rangeEnd){ out.push(new Date(t)); t=new Date(+t+stepMs);} }
    else if (rule.type==="weekMon"){ let t=LDT_Core.mondayOfWeek(new Date(rangeStart)); while (+t<=rangeEnd){ out.push(new Date(t)); t=LDT_Core.addDays(t,7*rule.step);} }
    else if (rule.type==="month1"){ let t=LDT_Core.monthStart(new Date(rangeStart)); while (+t<=rangeEnd){ out.push(new Date(t)); t=LDT_Core.nextMonthStart(t);} }
    return out;
  }
  function fmtTick(rule, d){
    const pad=n=>String(n).padStart(2,"0");
    if (rule.type==="hour") return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:00`;
    if (rule.type==="day") return `${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
    if (rule.type==="weekMon") return `Mon ${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
    if (rule.type==="month1"){ const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[d.getMonth()]} ${d.getFullYear()}`; }
    return d.toLocaleString();
  }


  // Singleton tooltip to avoid duplication & offset bugs
  const tooltip = (function(){
    let el, hideTimer=null, anchorY=0;
    function ensure(){
      if (!el){
        el = document.createElement("div");
        el.className = "ld-tooltip";
        el.id = "ld-tooltip";
        document.body.appendChild(el);
        el.addEventListener("mouseenter", ()=>{ clearTimeout(hideTimer); });
        el.addEventListener("mouseleave", ()=> scheduleHide() );
      }
      return el;
    }
    function show(html, xCenter, topY){
      const t = ensure();
      t.innerHTML = html;
      t.style.display = "block";
      const rect = t.getBoundingClientRect(); // width after content
      const x = Math.max(8, xCenter - rect.width/2);
      t.style.left = x + "px";
      t.style.top  = topY + "px";
    }
    function scheduleHide(){
      clearTimeout(hideTimer);
      hideTimer = setTimeout(()=>{ if(el) el.style.display="none"; }, (state.settings && state.settings.hoverPersistMs) || 2400);
    }
    function hide(){ if(el) el.style.display="none"; }
    return { show, scheduleHide, hide };
  })();

  function bindTooltipHover(el, eobj, stageEl){
    function handler(ev){
      const usingInferred = !eobj.endKnown && !!eobj.endInferred;
      const when = `${LDT_Core.formatEventRange(eobj, state.displayTimeZone)}${usingInferred ? " (*)" : ""}`;
      const shownTitle = LDT_Core.localizeEventTitle(eobj, state.lang, state.pokemonDB);
      const original = shownTitle !== eobj.title ? `<br/><span style="opacity:.75">${LDT_Core.escapeHTML(eobj.title)}</span>` : "";
      const fixed = LDT_Core.isFixedTimeEvent(eobj) ? `<br/><span class="nd-fixed-note">◆ ${LDT_Core.escapeHTML(LDT_Core.t(state.lang,"fixedTimeZone"))}: ${LDT_Core.escapeHTML(eobj.timeZone || "fixed")}</span>` : "";
      const href = LDT_Core.safeHref(eobj.href || "");
      const html = `<b>${LDT_Core.escapeHTML(shownTitle)}</b>${original}<br/>${LDT_Core.escapeHTML(when)}${fixed}${href? `<br/><a href="${href}" target="_blank" rel="noopener">details</a>`:""}`;
      const blockRect = el.getBoundingClientRect();
      const topY = Math.round(blockRect.bottom) + 2;
      const xCenter = Math.round((ev ? ev.clientX : (blockRect.left+blockRect.right)/2));
      tooltip.show(html, xCenter, topY);
    }
    el.addEventListener("mouseenter", handler);
    el.addEventListener("mousemove", handler);
    el.addEventListener("mouseleave", ()=> tooltip.scheduleHide());
  }



  function renderPeriodBlocks(svg, rangeStart, rangeEnd){
    const g = svg.querySelector("#ld-period-blocks");
    if(!g) return;
    g.innerHTML = "";
    const topPad = C.TIMELINE_TOP_PAD || 58;
    const monthH = C.PERIOD_MONTH_H || 20;
    const weekH = C.PERIOD_WEEK_H || 18;
    const xScale = t => ((t - rangeStart)/(rangeEnd - rangeStart)) * C.TL_W;
    if (!isFinite(xScale(rangeStart))) return;
    const mkText = (x,y,text,cls,anchor="start")=>{
      const t=document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",x); t.setAttribute("y",y); t.setAttribute("class",cls||"ld-period-label"); t.setAttribute("text-anchor", anchor); t.textContent=text; g.appendChild(t);
    };
    let mi=0;
    for(let t=LDT_Core.monthStart(new Date(rangeStart)); +t<rangeEnd; t=LDT_Core.nextMonthStart(t), mi++){
      const next=LDT_Core.nextMonthStart(t);
      const x=Math.max(0,xScale(+t)), w=Math.min(C.TL_W,xScale(+next))-x;
      if(!isFinite(x)||!isFinite(w)||w<=1) continue;
      const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
      r.setAttribute("x",x); r.setAttribute("y",0); r.setAttribute("width",w); r.setAttribute("height",monthH);
      r.setAttribute("class","ld-period-month-block"); r.setAttribute("fill-opacity", mi%2 ? "0.10" : "0.18"); g.appendChild(r);
      if(w>42) mkText(x+5,14,`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`,"ld-period-label ld-period-month-label");
    }
    const spanDays=(rangeEnd-rangeStart)/86400000;
    let wi=0;
    for(let t=LDT_Core.mondayOfWeek(new Date(rangeStart)); +t<rangeEnd; t=LDT_Core.addDays(t,7), wi++){
      const next=LDT_Core.addDays(t,7), x=Math.max(0,xScale(+t)), w=Math.min(C.TL_W,xScale(+next))-x;
      if(!isFinite(x)||!isFinite(w)||w<=1) continue;
      const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
      r.setAttribute("x",x); r.setAttribute("y",monthH+1); r.setAttribute("width",w); r.setAttribute("height",weekH);
      r.setAttribute("class","ld-period-week-block"); r.setAttribute("fill-opacity", wi%2 ? "0.12" : "0.06"); g.appendChild(r);
      if(spanDays <= 45 && w > 84){
        const letters=["M","T","W","T","F","S","S"];
        for(let i=0;i<7;i++) mkText(x+(i+0.5)*w/7, monthH+14, letters[i], "ld-period-label ld-period-week-label", "middle");
      } else if(w>34) {
        mkText(x+5,monthH+14,`W${String(getISOWeek(t)).padStart(2,"0")}`,"ld-period-label ld-period-week-label");
      }
    }
    const base=document.createElementNS("http://www.w3.org/2000/svg","line");
    base.setAttribute("x1",0); base.setAttribute("x2",C.TL_W); base.setAttribute("y1",topPad-2); base.setAttribute("y2",topPad-2); base.setAttribute("class","ld-period-baseline"); g.appendChild(base);
    function getISOWeek(date){ const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())); const day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-day); const y0=new Date(Date.UTC(d.getUTCFullYear(),0,1)); return Math.ceil((((d-y0)/86400000)+1)/7); }
  }

  function renderLaneSeparators(svg, layout){
    const seps=svg.querySelector("#ld-lane-seps"); seps.innerHTML="";
    const ys=new Set(Object.values(layout.ymap));
    Array.from(ys).sort((a,b)=>a-b).forEach(y=>{
      const l=document.createElementNS("http://www.w3.org/2000/svg","line");
      l.setAttribute("x1",0); l.setAttribute("x2",C.TL_W); l.setAttribute("y1",y-1); l.setAttribute("y2",y-1);
      l.setAttribute("class","ld-lane-sep"); seps.appendChild(l);
    });
  }

  function renderBackground(svg, rangeStart, rangeEnd){
    const monthBg=svg.querySelector("#ld-month-bgs");
    const weekendBg=svg.querySelector("#ld-weekend-bgs");
    monthBg.innerHTML=""; weekendBg.innerHTML="";
    const useMonthAlternation = LDT_Core.isRangeOverNdays(rangeStart, rangeEnd, 90);
    const xScale = t => ((t - rangeStart)/(rangeEnd - rangeStart)) * C.TL_W;
    if (!isFinite(xScale(rangeStart))) return; // NaN guard
    if (useMonthAlternation){
      let t=LDT_Core.monthStart(new Date(rangeStart));
      let isOdd = (t.getMonth()%2===1);
      while (+t<rangeEnd){
        const next=LDT_Core.nextMonthStart(t);
        const x=xScale(+t); const w=xScale(+next)-x;
        if (isFinite(x) && isFinite(w)){
          const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
          r.setAttribute("x", x); r.setAttribute("y", 0); r.setAttribute("width", w); r.setAttribute("height", (C.HEIGHT-78));
          r.setAttribute("class","ld-month-bg");
          r.setAttribute("fill-opacity", isOdd ? "0.18" : "0.045");
          monthBg.appendChild(r);
        }
        t=next; isOdd=!isOdd;
      }
    } else {
      let t=LDT_Core.beginOfDay(new Date(rangeStart));
      while (+t<rangeEnd){
        if (LDT_Core.isWeekend(t)){
          const dayEnd=LDT_Core.endOfDay(t);
          const x=xScale(Math.max(+t, rangeStart)); const w=xScale(Math.min(+dayEnd, rangeEnd)) - x;
          if (isFinite(x) && isFinite(w)){
            const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
            r.setAttribute("x", x); r.setAttribute("y", 0); r.setAttribute("width", w); r.setAttribute("height", (C.HEIGHT-78));
            r.setAttribute("class","ld-weekend-bg");
            r.setAttribute("fill-opacity","0.075");
            weekendBg.appendChild(r);
          }
        }
        t=LDT_Core.addDays(t,1);
      }
    }
  }


  function applyRenderSettings(){
    state.settings = LDT_Core.normalizeSettings(state.settings);
    document.documentElement.style.setProperty("--nd-outer-margin-x", state.settings.outerMarginX + "px");
    document.documentElement.style.setProperty("--nd-item-font-size", state.settings.fontSize + "px");
    document.documentElement.style.setProperty("--nd-item-font-weight", state.settings.fontWeight);
    const wrap=document.getElementById(WRAP_ID);
    if(wrap) wrap.style.marginLeft = wrap.style.marginRight = state.settings.outerMarginX + "px";
  }


  function populateTimeZoneSelect(){
    const sel=document.getElementById("ld-timezone-select");
    if(!sel) return;
    if(!sel.childElementCount){
      LDT_Core.DISPLAY_TIME_ZONES.forEach(z=>{
        const opt=document.createElement("option");
        opt.value=z.id; opt.textContent=z.label; sel.appendChild(opt);
      });
    }
    sel.value=state.displayTimeZone || "local";
  }
  function syncViewToggleButton(){
    const btn=document.querySelector('[data-act="toggle-view"] span');
    if(btn) btn.textContent = state.viewMode === "linear" ? LDT_Core.t(state.lang,"switchMonthGrid") : LDT_Core.t(state.lang,"switchLinear");
  }
  function currentRangeEventBounds(){
    const vals=(state.events||[]).map(e=>({s:LDT_Core.eventStartMs(e,state.displayTimeZone), e:LDT_Core.eventEndMs(e,state.displayTimeZone)})).filter(x=>isFinite(x.s)&&isFinite(x.e));
    if(!vals.length) return null;
    return {min:Math.min(...vals.map(x=>x.s)), max:Math.max(...vals.map(x=>x.e))};
  }

  function approxTextWidth(text){
    const fs = (state.settings && state.settings.fontSize) || 11;
    let n=0;
    for(const ch of String(text || "")) n += /[\u2E80-\u9FFF\uAC00-\uD7AF]/.test(ch) ? fs : fs*0.56;
    return n;
  }

  function selectedOrVisibleEvents(){
    const ids = state.selectedIds || new Set();
    const selected = state.events.filter(e => ids.has(e.id));
    return selected.length ? selected : LDT_Core.visibleEventsInRange(state.events, state.rangeStart, state.rangeEnd);
  }

  function saveBlob(filename, text, type){
    const url = URL.createObjectURL(new Blob([text], {type:type || "text/plain;charset=utf-8"}));
    const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function exportSelectedICS(){
    const list = selectedOrVisibleEvents();
    if(!list.length){ alert(LDT_Core.t(state.lang, "noEventsExport")); return; }
    saveBlob("neatduck-timeline-events.ics", LDT_Core.eventsToICS(list, state.lang, state.pokemonDB), "text/calendar;charset=utf-8");
  }

  function emailSelectedLog(){
    const list = selectedOrVisibleEvents();
    if(!list.length){ alert(LDT_Core.t(state.lang, "noEmailEvents")); return; }
    const body = LDT_Core.eventsToTextLog(list, state.lang, state.pokemonDB);
    const url = "mailto:?subject=" + encodeURIComponent("NeatDuck_Timeline Event Log") + "&body=" + encodeURIComponent(body);
    window.open(url, "_blank");
  }

  function refreshRemoteData(showAlert){
    if (!(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage)) return Promise.resolve(null);
    return new Promise(resolve => {
      try{
        chrome.runtime.sendMessage({type:"nd_refresh_remote_events"}, resp => {
          if (chrome.runtime.lastError){ if(showAlert) alert(LDT_Core.t(state.lang, "remoteFail") + chrome.runtime.lastError.message); resolve(null); return; }
          if(showAlert) alert(resp && resp.ok ? LDT_Core.t(state.lang, "remoteSuccess") : (LDT_Core.t(state.lang, "remoteFail") + ((resp && resp.error) || "未知错误")));
          resolve(resp || null);
        });
      }catch(err){ if(showAlert) alert(LDT_Core.t(state.lang, "remoteFail") + err.message); resolve(null); }
    });
  }

  function buildSettingsModal(){
    const modal=document.getElementById("ld-settings-modal"), body=document.getElementById("ld-settings-body"), mask=document.getElementById("ld-mask");
    if(!modal || !body || !mask) return;
    const s=LDT_Core.normalizeSettings(state.settings);
    const t=(key)=>LDT_Core.t(state.lang, key);
    const row=(key,labelKey,type="number", extra="")=>`<tr><td>${LDT_Core.escapeHTML(t(labelKey))}</td><td><input data-setting="${key}" type="${type}" value="${LDT_Core.escapeHTML(s[key])}" ${extra}></td></tr>`;
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
      <tr><td>${LDT_Core.escapeHTML(t("settingsLabelOutline"))}</td><td><label><input data-setting="labelOutline" type="checkbox" ${s.labelOutline?"checked":""}> ${LDT_Core.escapeHTML(t("settingsEnable"))}</label></td></tr>
      <tr><td>${LDT_Core.escapeHTML(t("settingsRemoteUrl"))}</td><td><input data-setting="remoteUrl" type="url" value="${LDT_Core.escapeHTML(state.remoteUrl || LDT_Core.DEFAULT_REMOTE_URL)}" style="width:100%"></td></tr>
    </tbody></table><p style="font-size:12px;color:#667085;margin:8px 0 0">${LDT_Core.escapeHTML(t("settingsHint"))}</p>`;
    mask.style.display="block"; modal.style.display="block";
    const save=async()=>{
      const next={};
      body.querySelectorAll("[data-setting]").forEach(input=>{
        const key=input.getAttribute("data-setting");
        if(key === "remoteUrl") return;
        next[key] = input.type === "checkbox" ? input.checked : Number(input.value);
      });
      state.settings=LDT_Core.normalizeSettings(next);
      state.remoteUrl=LDT_Core.normalizeRemoteUrl((body.querySelector('[data-setting="remoteUrl"]') || {}).value || LDT_Core.DEFAULT_REMOTE_URL);
      await LDT_Core.saveState({ld_settings:state.settings, ld_remote_url:state.remoteUrl});
      applyRenderSettings(); updateViewMode();
    };
    const saveBtn=modal.querySelector('[data-save="settings"]');
    if(saveBtn) saveBtn.onclick=save;
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
    const extLayer=document.getElementById("ld-extenders"); if(extLayer) extLayer.innerHTML="";
    const xScale = t => ((t - rangeStart)/(rangeEnd - rangeStart)) * C.TL_W;
    if (!isFinite(xScale(rangeStart))) return;
    const cfg=LDT_Core.normalizeSettings(state.settings);
    const pad=cfg.labelPaddingX;
    const minW=cfg.minShortEventWidth;
    const map = {};
    events.forEach(e=>{
      const sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone);
      if(!isFinite(sMs)||!isFinite(eMs)) return;
      const key=`${e.lane}::${e.sub}`; (map[key]=map[key]||[]).push(e);
    });
    Object.values(map).forEach(a=>a.sort((x,y)=>LDT_Core.eventStartMs(x,state.displayTimeZone)-LDT_Core.eventStartMs(y,state.displayTimeZone)));

    for (const key of Object.keys(map)){
      const arr=map[key];
      for(let i=0;i<arr.length;i++){
        const e=arr[i];
        const startMs=LDT_Core.eventStartMs(e,state.displayTimeZone), endMs=LDT_Core.eventEndMs(e,state.displayTimeZone);
        if(!isFinite(startMs)||!isFinite(endMs)) continue;
        const x1=xScale(startMs), x2=xScale(endMs); if (!isFinite(x1)||!isFinite(x2)) continue;
        const y=layout.ymap[`${e.lane}::${e.sub}`] || layout.ymap[`${e.lane}::${e.lane}`];
        if (y == null) continue;
        const actualW = Math.max(0, x2-x1);
        const isShortTimed = ["Max Mondays","Raid Hour","Pokémon Spotlight Hour"].includes(e.sub) || (actualW > 0 && actualW < minW);
        const blockW=Math.max(isShortTimed ? minW : 2, actualW);
        const fillColor=colors[e.sub]||colors[e.category]||colors[e.lane]||"lightsteelblue";
        const next = arr[i+1];
        const nextStart = next ? LDT_Core.eventStartMs(next,state.displayTimeZone) : NaN;
        const nextX = isFinite(nextStart) ? xScale(nextStart) : Infinity;
        const nextLimit = Math.min(C.TL_W, isFinite(nextX) ? nextX - cfg.shadeGap : C.TL_W);
        const rawTitle = LDT_Core.localizeEventTitle(e, state.lang, state.pokemonDB).trim();
        const desiredW = approxTextWidth(rawTitle) + pad * 2;
        const baseEnd = Math.max(x2, x1 + blockW);
        const visibleStart = Math.max(0, x1);
        const visibleBaseEnd = Math.min(C.TL_W, baseEnd);
        let labelBoxEnd = visibleBaseEnd;
        let shadeRect=null;
        if (desiredW > Math.max(0, visibleBaseEnd - visibleStart) && cfg.shadeMaxWidth > 0){
          labelBoxEnd = Math.min(nextLimit, visibleStart + Math.min(desiredW, (visibleBaseEnd - visibleStart) + cfg.shadeMaxWidth));
          if (labelBoxEnd > visibleBaseEnd + 1){
            shadeRect=document.createElementNS("http://www.w3.org/2000/svg","rect");
            shadeRect.setAttribute("x", visibleBaseEnd); shadeRect.setAttribute("y", y);
            shadeRect.setAttribute("width", labelBoxEnd - visibleBaseEnd); shadeRect.setAttribute("height", C.ITEM_H);
            shadeRect.setAttribute("rx", cfg.itemRadius); shadeRect.setAttribute("ry", cfg.itemRadius);
            shadeRect.setAttribute("fill", fillColor); shadeRect.setAttribute("fill-opacity", "0.50");
            shadeRect.setAttribute("class", "ld-item-shade");
            g.appendChild(shadeRect);
          }
        }
        const fixed=LDT_Core.isFixedTimeEvent(e);
        const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
        rect.setAttribute("x",x1); rect.setAttribute("y",y); rect.setAttribute("width",blockW); rect.setAttribute("height",C.ITEM_H);
        rect.setAttribute("rx",cfg.itemRadius); rect.setAttribute("ry",cfg.itemRadius);
        rect.setAttribute("class","ld-item"+(fixed?" fixed-tz":"")+(!e.endKnown?" inferred":"")+(state.selectedIds && state.selectedIds.has(e.id)?" selected":""));
        rect.setAttribute("fill",fillColor); rect.setAttribute("stroke-width",fixed?Math.max(cfg.itemBorderWidth+1,2.25):cfg.itemBorderWidth); g.appendChild(rect);
        const visX1=Math.max(0, x1), visX2=Math.min(C.TL_W, Math.max(labelBoxEnd, visibleBaseEnd)), visW=Math.max(0, visX2-visX1);
        if (visW > 1){
          const makeText=()=>{
            const t=document.createElementNS("http://www.w3.org/2000/svg","text");
            t.setAttribute("text-anchor","start");
            t.setAttribute("x", visX1 + pad);
            t.setAttribute("y", y + C.ITEM_H/2 + Math.round(cfg.fontSize * 0.36));
            t.setAttribute("font-size", cfg.fontSize);
            t.setAttribute("font-weight", cfg.fontWeight);
            return t;
          };
          let finalText=rawTitle;
          const allow=Math.max(0, visW - pad*2);
          if (approxTextWidth(finalText) > allow){
            let lo=0, hi=finalText.length;
            while(lo<hi){ const mid=Math.floor((lo+hi+1)/2); const probe=finalText.slice(0,mid)+"…"; if(approxTextWidth(probe)<=allow) lo=mid; else hi=mid-1; }
            finalText=finalText.slice(0,lo)+(lo<rawTitle.length?"…":"");
          }
          const label = addLabelWithCrispHalo(g, makeText, finalText, cfg.labelOutline);
          if(!cfg.labelOutline) label.setAttribute("fill", LDT_Core.contrastTextColor(fillColor));
          label.addEventListener("click", ev=>{ ev.stopPropagation(); toggleSelect(e.id); });
          bindTooltipHover(label, e, document.getElementById("ld-right"));
        }
        const selectTargets=[rect]; if(shadeRect) selectTargets.push(shadeRect);
        selectTargets.forEach(node=>{
          node.addEventListener("click", ev=>{ ev.stopPropagation(); toggleSelect(e.id); });
          node.addEventListener("mouseenter",()=>{ node.setAttribute("stroke-width", Math.max(cfg.itemBorderWidth, fixed?3:2)); });
          node.addEventListener("mouseleave",()=>{ node.setAttribute("stroke-width", fixed?Math.max(cfg.itemBorderWidth+1,2.25):cfg.itemBorderWidth); });
          bindTooltipHover(node, e, document.getElementById("ld-right"));
        });
        if (!e.endKnown){ const p=document.createElementNS("http://www.w3.org/2000/svg","polygon"); p.setAttribute("points", `${x2},${y} ${x2},${y+C.ITEM_H} ${x2+8},${y+C.ITEM_H/2}`); p.setAttribute("fill","rgba(0,0,0,0.25)"); g.appendChild(p); }
      }
    }
    for (const e of events){
      if (e.lane!=="raids" || !e.overlay) continue;
      const startMs=LDT_Core.eventStartMs(e,state.displayTimeZone), endMs=LDT_Core.eventEndMs(e,state.displayTimeZone);
      if(!isFinite(startMs)||!isFinite(endMs)) continue;
      const x1=xScale(startMs), x2=xScale(endMs); if (!isFinite(x1)||!isFinite(x2)) continue;
      const y=layout.ymap[`raids::${e.overlayTargetSub||e.sub}`] || layout.ymap[`raids::${e.sub}`];
      if (y == null) continue;
      const w=Math.max(minW, x2-x1);
      const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
      rect.setAttribute("x",x1); rect.setAttribute("y",y); rect.setAttribute("width",w); rect.setAttribute("height",C.ITEM_H); rect.setAttribute("rx",cfg.itemRadius); rect.setAttribute("ry",cfg.itemRadius);
      rect.setAttribute("class","ld-item ld-overlay"+(state.selectedIds && state.selectedIds.has(e.id)?" selected":"")); const fillColor=(state.colors[e.overlay]||"rgba(255,0,0,0.25)"); rect.setAttribute("fill",fillColor); rect.setAttribute("fill-opacity","0.92"); rect.setAttribute("stroke-width",cfg.itemBorderWidth); g.appendChild(rect);
      rect.addEventListener("click", ev=>{ ev.stopPropagation(); toggleSelect(e.id); });
      bindTooltipHover(rect, e, document.getElementById("ld-right"));
    }
  }

  function toggleSelect(id){
    if(!id) return;
    if(!state.selectedIds) state.selectedIds=new Set();
    if(state.selectedIds.has(id)) state.selectedIds.delete(id); else state.selectedIds.add(id);
    updateViewMode();
  }

  function renderRulers(svg, rangeStart, rangeEnd){
    const top=svg.querySelector("#ld-ruler-top");
    const bottom=svg.querySelector("#ld-ruler-bottom");
    top.innerHTML=""; bottom.innerHTML="";
    const rule=chooseTickStep(rangeStart, rangeEnd);
    const points=buildTicks(rule, rangeStart, rangeEnd);
    const xScale = t => ((t - rangeStart)/(rangeEnd - rangeStart)) * C.TL_W;
    if (!isFinite(xScale(rangeStart))) return; // NaN guard
    const mk=(group, y)=>{
      const gGrid=document.createElementNS("http://www.w3.org/2000/svg","g"); gGrid.setAttribute("class","ld-grid"); group.appendChild(gGrid);
      points.forEach(d=>{
        const x=xScale(+d);
        if (!isFinite(x)) return;
        const l=document.createElementNS("http://www.w3.org/2000/svg","line");
        l.setAttribute("x1",x); l.setAttribute("x2",x); l.setAttribute("y1",y); l.setAttribute("y2",(C.HEIGHT - 78) - C.BOTTOM_RULER_H); gGrid.appendChild(l);
        const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute("x",x+3); t.setAttribute("y",y-6); t.textContent=fmtTick(rule,d); group.appendChild(t);
      });
    };
    mk(top, C.TIMELINE_TOP_PAD || C.TOP_RULER_H);
    const gGrid=document.createElementNS("http://www.w3.org/2000/svg","g"); gGrid.setAttribute("class","ld-grid"); bottom.appendChild(gGrid);
    points.forEach(d=>{
      const x=xScale(+d);
      if (!isFinite(x)) return;
      const l=document.createElementNS("http://www.w3.org/2000/svg","line");
      l.setAttribute("x1",x); l.setAttribute("x2",x); l.setAttribute("y1",C.TIMELINE_TOP_PAD || 0); l.setAttribute("y2",(C.HEIGHT - 78) - C.BOTTOM_RULER_H); gGrid.appendChild(l);
      const t=document.createElementNS("http://www.w3.org/2000/svg","text"); t.setAttribute("x",x+3); t.setAttribute("y",(C.HEIGHT - 78)-6); t.textContent=fmtTick(rule,d); bottom.appendChild(t);
    });
  }

  function renderNowLine(svg, rangeStart, rangeEnd){
    const xScale = t => ((t - rangeStart)/(rangeEnd - rangeStart)) * C.TL_W;
    const line=svg.querySelector("#ld-now line");
    const nowX=xScale(Date.now());
    if (isFinite(nowX)){ line.setAttribute("x1",nowX); line.setAttribute("x2",nowX); }
  }

  function renderLinear(){
    const svg=document.getElementById(SVG_ID);
    const layout=laneLayout();
    renderLegend(layout);
    renderBackground(svg, state.rangeStart, state.rangeEnd);
    renderPeriodBlocks(svg, state.rangeStart, state.rangeEnd);
    renderLaneSeparators(svg, layout);
    renderRulers(svg, state.rangeStart, state.rangeEnd);
    renderItems(svg, state.events, state.colors, layout, state.rangeStart, state.rangeEnd);
    renderNowLine(svg, state.rangeStart, state.rangeEnd);
  }

  function renderMonthGrid(){
    const svg = document.getElementById(SVG_ID);
    const mg  = document.getElementById("ld-monthgrid");
    svg.style.display = "none"; mg.style.display = "block"; mg.innerHTML = "";
    mg.className = "nd-monthgrid";
    mg.style.position="relative"; mg.style.height=(C.HEIGHT-78)+"px"; mg.style.overflowY="auto"; mg.style.width=C.TL_W+"px";
    const colW = C.TL_W / 7;
    const baseMon = LDT_Core.mondayOfWeek(new Date(state.rangeStart));
    const endLimit = LDT_Core.addDays(LDT_Core.mondayOfWeek(new Date(state.rangeEnd)), 7);
    const weeks = [];
    for(let t=baseMon; +t<+endLimit; t=LDT_Core.addDays(t,7)) weeks.push({start:new Date(t), end:LDT_Core.addDays(t,7)});
    const dow = ["M","T","W","T","F","S","S"];
    const nowDay = LDT_Core.beginOfDay(new Date());
    const colors=state.colors;
    function timeText(e){
      const s=LDT_Core.eventDisplayDate(e,"start",state.displayTimeZone), d=LDT_Core.eventDisplayDate(e,"endKnown",state.displayTimeZone)||LDT_Core.eventDisplayDate(e,"endInferred",state.displayTimeZone);
      if(!s||!d) return "";
      const pad=n=>String(n).padStart(2,"0");
      if(s.getHours()===0 && s.getMinutes()===0 && d.getHours()>=23) return "";
      return `${pad(s.getHours())}:${pad(s.getMinutes())}-${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    weeks.forEach((week)=>{
      const events=(state.events||[]).filter(e=>{
        const sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone);
        return isFinite(sMs)&&isFinite(eMs)&&eMs>=+week.start&&sMs<+week.end;
      }).sort((a,b)=>{
        const da=LDT_Core.eventEndMs(a,state.displayTimeZone)-LDT_Core.eventStartMs(a,state.displayTimeZone);
        const db=LDT_Core.eventEndMs(b,state.displayTimeZone)-LDT_Core.eventStartMs(b,state.displayTimeZone);
        return (db-da) || (LDT_Core.eventStartMs(a,state.displayTimeZone)-LDT_Core.eventStartMs(b,state.displayTimeZone));
      });
      const shown=events.slice(0,9);
      const rowH = 34 + Math.max(4, shown.length) * 21 + (events.length>shown.length ? 18 : 0);
      const row=document.createElement("div"); row.className="week-row"; row.style.position="relative"; row.style.height=rowH+"px"; mg.appendChild(row);
      for(let i=0;i<7;i++){
        const d=LDT_Core.addDays(week.start,i), dayStart=LDT_Core.beginOfDay(d);
        const day=document.createElement("div"); day.className="nd-month-day"; day.style.left=(i*colW)+"px"; day.style.width=colW+"px"; row.appendChild(day);
        if(+dayStart===+nowDay) day.classList.add("today");
        const lab=document.createElement("div"); lab.className="nd-month-label"; lab.style.left=(i*colW+4)+"px"; lab.textContent=`${dow[i]} ${d.getMonth()+1}/${d.getDate()}`; row.appendChild(lab);
      }
      shown.forEach((e,idx)=>{
        const sMs=LDT_Core.eventStartMs(e,state.displayTimeZone), eMs=LDT_Core.eventEndMs(e,state.displayTimeZone);
        const left=Math.max(0, Math.min(7, (sMs-+week.start)/86400000))*colW + 2;
        const right=Math.max(0, Math.min(7, (eMs-+week.start)/86400000))*colW - 2;
        const width=Math.max(18, right-left);
        const div=document.createElement("div");
        const fill=colors[e.sub]||colors[e.category]||colors[e.lane]||"lightsteelblue";
        div.className="nd-month-event" + (LDT_Core.isFixedTimeEvent(e)?" fixed-tz":"");
        div.style.left=left+"px"; div.style.top=(28+idx*21)+"px"; div.style.width=width+"px"; div.style.background=fill; div.style.color=LDT_Core.contrastTextColor(fill);
        const tt=timeText(e); div.textContent=(tt?tt+" ":"")+LDT_Core.localizeEventTitle(e, state.lang, state.pokemonDB);
        div.title=LDT_Core.formatEventRange(e,state.displayTimeZone);
        div.addEventListener("click", ev=>{ ev.stopPropagation(); toggleSelect(e.id); });
        row.appendChild(div);
      });
      if(events.length>shown.length){
        const more=document.createElement("div"); more.className="nd-month-more"; more.style.top=(28+shown.length*21)+"px"; more.textContent=`+${events.length-shown.length} more`; row.appendChild(more);
      }
    });
  }

  function updateViewMode(){
    const svg=document.getElementById(SVG_ID);
    const mg=document.getElementById("ld-monthgrid");
    syncViewToggleButton();
    if (state.viewMode==="linear"){ svg.style.display="block"; mg.style.display="none"; renderLinear(); }
    else { renderMonthGrid(); }
  }

  function attachTimelineInteractions(){
    const stage=document.getElementById("ld-right");
    if(!stage || stage.__ldtBound) return;
    stage.__ldtBound = true;
    let dragging=false, lastX=0;
    function panByPixels(dx){
      const span = state.rangeEnd - state.rangeStart;
      if(!isFinite(span) || span<=0) return;
      const delta = (dx / C.TL_W) * span;
      state.rangeStart -= delta;
      state.rangeEnd -= delta;
      updateViewMode();
    }
    stage.addEventListener("mousedown", (ev)=>{
      if(state.viewMode!=="linear" || ev.button!==0) return;
      if(ev.target.closest && ev.target.closest(".ld-tooltip,.ld-modal,#ld-topbar")) return;
      dragging=true; lastX=ev.clientX; stage.style.cursor="grabbing"; ev.preventDefault();
    });
    window.addEventListener("mouseup", ()=>{ dragging=false; stage.style.cursor=""; });
    window.addEventListener("mousemove", (ev)=>{
      if(!dragging || state.viewMode!=="linear") return;
      const dx=ev.clientX-lastX; lastX=ev.clientX;
      panByPixels(dx);
    });
    stage.addEventListener("wheel", (ev)=>{
      if(state.viewMode!=="linear") return;
      ev.preventDefault();
      const rect=stage.getBoundingClientRect();
      const x=Math.max(0, Math.min(C.TL_W, (ev.clientX-rect.left) * (C.TL_W / Math.max(1, rect.width))));
      const center = state.rangeStart + (x / C.TL_W) * (state.rangeEnd-state.rangeStart);
      const oldSpan = state.rangeEnd-state.rangeStart;
      const factor = ev.deltaY < 0 ? 0.82 : 1.22;
      const minSpan = 6*3600000, maxSpan = 240*86400000;
      const newSpan = Math.max(minSpan, Math.min(maxSpan, oldSpan*factor));
      const ratio = x / C.TL_W;
      state.rangeStart = center - ratio*newSpan;
      state.rangeEnd = state.rangeStart + newSpan;
      updateViewMode();
    }, {passive:false});
  }

  function buildColorsModal(){
    const mask=document.getElementById("ld-mask");
    const modal=document.getElementById("ld-colors-modal");
    const rows=document.getElementById("ld-colors-rows");
    rows.innerHTML="";
    const cats=new Set(); LANES_SPEC.forEach(l=>(l.sub||[]).forEach(s=>cats.add(s))); state.events.forEach(e=>{ if (e.sub) cats.add(e.sub); if (e.overlay) cats.add(e.overlay); });
    Array.from(cats).sort().forEach(cat=>{
      const row=document.createElement("div"); row.className="row"; row.style.display="flex"; row.style.alignItems="center"; row.style.gap="8px"; row.style.margin="6px 0";
      const lab=document.createElement("label"); lab.textContent=cat; lab.style.width="220px";
      const inp=document.createElement("input"); inp.type="color"; function toHex(c){ const ctx=document.createElement("canvas").getContext("2d"); ctx.fillStyle=c; const computed=ctx.fillStyle; if(/^#/.test(computed)) return computed; const m=computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); if(m){ const r=(+m[1]).toString(16).padStart(2,'0'); const g=(+m[2]).toString(16).padStart(2,'0'); const b=(+m[3]).toString(16).padStart(2,'0'); return `#${r}${g}${b}`;} return "#999999"; } inp.value=toHex(state.colors[cat]||LDT_Core.hashColor(cat)); inp.addEventListener("input", async ()=>{ state.colors[cat]=inp.value; await LDT_Core.saveState({ld_colors:state.colors}); updateViewMode(); });
      row.appendChild(lab); row.appendChild(inp); rows.appendChild(row);
    });
    mask.style.display="block"; modal.style.display="block";
  }

  function closeModal(which){
    const mask=document.getElementById("ld-mask"); mask.style.display="none";
    document.getElementById(`ld-${which}-modal`).style.display="none";
  }

  function compareAndMaybePrompt(updated){
    const before = state.events;
    // map by id
    const mapOld = {}; before.forEach(e=> mapOld[e.id]=e);
    const diffs = [];
    for (const e of updated){
      const old = mapOld[e.id];
      if (!old) continue;
      const ch = [];
      const eq = (a,b)=> (a&&b)? (+new Date(a)===+new Date(b)) : (a==null && b==null);
      if ((old.title||"") !== (e.title||"")) ch.push(["title", old.title, e.title]);
      if (!eq(old.start, e.start)) ch.push(["start", old.start, e.start]);
      if (!eq(old.endKnown, e.endKnown)) ch.push(["end", old.endKnown, e.endKnown]);
      if (ch.length) diffs.push({id:e.id, title:e.title, changes:ch});
    }
    if (!diffs.length) return;
    const modal=document.getElementById("ld-updates-modal");
    const body=document.getElementById("ld-updates-body");
    const mask=document.getElementById("ld-mask");
    body.innerHTML = `<table><thead><tr><th>Event</th><th>Field</th><th>Old</th><th>New</th></tr></thead><tbody>${
      diffs.map(d => d.changes.map(c => `<tr><td>${LDT_Core.escapeHTML(d.title)}</td><td>${LDT_Core.escapeHTML(c[0])}</td><td>${LDT_Core.escapeHTML(c[1]?LDT_Core.fmt(new Date(c[1])):"")}</td><td>${LDT_Core.escapeHTML(c[2]?LDT_Core.fmt(new Date(c[2])):"")}</td></tr>`).join("")
      ).join("")
    }</tbody></table>`;
    mask.style.display="block"; modal.style.display="block";
    modal.querySelector("[data-apply='updates']").onclick = async ()=>{
      // merge updates into csv
      const saved = await LDT_Core.saveEventsToHistory(updated, { force:true, detailsCache: state.detailsCache });
      const merged = (saved && saved.events) ? saved.events : LDT_Core.dedupeEvents((state.events || []).concat(updated));
      state.csvText = (saved && saved.csv) ? saved.csv : LDT_Core.eventsToCSV(merged);
      state.events = merged; closeModal("updates"); updateViewMode();
    };
    modal.querySelector("[data-close='updates']").onclick = ()=> closeModal("updates");
  }

  async function scrapeEventsFromDOM(){
    const items=[];
    const wrappers=Array.from(document.querySelectorAll('span.event-header-item-wrapper, article, .event-card, .events-list .event'));
    let done=0;
    const progressText = document.getElementById("ld-scan-progress");
    async function fetchDetailDates(href){
      if(!href) return {start:null,end:null};
      const key = LDT_Core.normalizeHref(href);
      const cached = key ? state.detailsCache[key] : null;
      if (cached && (cached.start || cached.end)){
        const cs = LDT_Core.parseLocalDateString(cached.start);
        const ce = LDT_Core.parseLocalDateString(cached.end);
        const freshEnough = cached.savedAt && (Date.now() - Number(cached.savedAt) < 36*3600000);
        if (freshEnough && (!cs || !ce || ce >= cs)) return { start:cs, end:ce };
      }
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(()=>ctrl.abort(), 8000) : null;
      try{
        const resp = await fetch(href, { signal: ctrl ? ctrl.signal : undefined, credentials:"same-origin" });
        const html = await resp.text();
        const parsed = LDT_Core.parseEventDetailHTML(html);
        if (key && (parsed.start || parsed.end)){
          state.detailsCache[key] = {
            start: LDT_Core.toISODate(parsed.start),
            end: LDT_Core.toISODate(parsed.end),
            savedAt: Date.now()
          };
        }
        return parsed;
      }catch(err){
        console.warn("LDT: detail date fetch failed", href, err && err.message ? err.message : err);
        return {start:null,end:null};
      }finally{
        if (timer) clearTimeout(timer);
      }
    }
    function detectCardSection(card){
      let node = card;
      for(let i=0;i<7 && node;i++){
        let prev = node.previousElementSibling;
        while(prev){
          const txt=(prev.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
          if (/upcoming events|starts/.test(txt)) return "upcoming";
          if (/happening now|live now|ends/.test(txt)) return "happening";
          if (/^h[1-6]$/i.test(prev.tagName||"")) break;
          prev = prev.previousElementSibling;
        }
        const heading = node.parentElement && node.parentElement.querySelector && node.parentElement.querySelector('h1,h2,h3,h4,h5');
        if (heading){
          const h=(heading.textContent||"").toLowerCase();
          if (/upcoming/.test(h)) return "upcoming";
          if (/happening|live now/.test(h)) return "happening";
        }
        node = node.parentElement;
      }
      return "";
    }

    for (const w of wrappers){
      try{
        const titleEl=w.querySelector('h2,h3,.event-title');
        let title=titleEl?titleEl.textContent.trim():"";
        title = LDT_Core.cleanTitle(title);
        if (!title || /^Happening\s+Now$/i.test(title)) continue;
        const a=w.querySelector('a.event-item-link, a[href]');
        const href=a ? (new URL(a.getAttribute('href'), location.origin)).toString() : "";
        const categoryEl=w.querySelector('p.badge, .badge, .label, .category, .event-type, .event-item-wrapper > p, p');
        const category=categoryEl?(categoryEl.textContent||"").trim():"";
        const rawText=(w.textContent||"").replace(/Happening\s+Now/ig,"").trim();
        const timeEl=w.querySelector('h5,time,[data-event-start-date],p[data-event-list-date]');
        const sectionHint = detectCardSection(w);
        let endRaw=timeEl?(timeEl.getAttribute('data-event-end-date')):null;
        let startRaw=timeEl?(timeEl.getAttribute('data-event-start-date-check')||timeEl.getAttribute('data-event-start-date')||timeEl.getAttribute('datetime')||timeEl.getAttribute('data-event-list-date')):null;
        let cardDate=LDT_Core.parseLocalDateString(startRaw);
        let start = sectionHint === "happening" ? null : cardDate;
        let endKnown = LDT_Core.parseLocalDateString(endRaw) || (sectionHint === "happening" ? cardDate : null);
        const detail = await fetchDetailDates(href);
        // Detail pages are more reliable than section cards; replace one-sided Happening/Upcoming dates when available.
        if(detail.start) start = detail.start;
        if(detail.end) endKnown = detail.end;
        const e={ title, category, rawText, href, start, endKnown, endInferred:null, isLocal:true };
        const laneSub=LDT_Core.chooseLaneAndSub(e); e.lane=laneSub.lane; e.sub=laneSub.sub; e.overlay=laneSub.overlay||null; e.overlayTargetSub=laneSub.overlayTargetSub||null;
        if (e.lane==="weekly") e.shortTitle=LDT_Core.shortenWeekly(title);
        else if (e.lane==="raids") e.shortTitle=LDT_Core.shortenRaids(title);
        else if (e.lane==="gbl") e.shortTitle=LDT_Core.shortenGBL(title);
        else e.shortTitle=LDT_Core.cleanTitle(title);
        e.shortTitle = (e.shortTitle||"").replace(/\s+Battles?$/i, "").trim();
        if (!e.endKnown){
          const r=LDT_Core.inferEnd(e, items);
          e.endInferred = r.inferred;
        }
        const normalized = LDT_Core.normalizeLegacyEvent(e);
        if (normalized) items.push(normalized);
      }catch(err){ console.warn("LDT parse item failed", err); }
      finally{
        done++;
        if(progressText) progressText.textContent = `${done}/${wrappers.length}`;
      }
    }
    const deduped = LDT_Core.dedupeEvents(items);
    LDT_Core.assignThemeRows(deduped);
    return deduped;
  }

  function setLang(lang){
    state.lang=lang; const dict=I18N[lang]||I18N["en"];
    document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.getAttribute("data-i18n"); el.textContent=dict[k]||k; });
    const sel=document.getElementById("ld-lang-select"); if (sel) sel.value=lang; populateTimeZoneSelect(); syncViewToggleButton();
    const settingsModal=document.getElementById("ld-settings-modal");
    if(settingsModal && settingsModal.style.display==="block") buildSettingsModal();
    if (state.events && state.events.length) updateViewMode();
  }

  function attachControls(){
    const controls=document.getElementById("ld-topbar"); if (!controls || controls.__ldtControlsBound) return;
    controls.__ldtControlsBound = true;
    controls.addEventListener("click", async (e)=>{
      const b=e.target.closest(".btn"); if (!b) return;
      const act=b.getAttribute("data-act");
      if (act==="settings"){ buildSettingsModal(); }
      if (act==="colors"){ buildColorsModal(); }
      if (act==="today"){
        const span = state.rangeEnd - state.rangeStart;
        if (isFinite(span) && span > 0){
          state.rangeStart = Date.now() - span * 0.25;
          state.rangeEnd = state.rangeStart + span;
          updateViewMode();
        }
      }
      if (act==="open-standalone"){
        // Open immediately while the click is still a user gesture; then save.
        // Waiting for chrome.storage first can make Chrome treat this as a blocked popup.
        const url = chrome.runtime.getURL(`standalone.html?source=content&ts=${Date.now()}`);
        const opened = window.open(url, "_blank");
        if (!opened){ alert("Chrome blocked the standalone page. Please allow popups for this site or click the extension icon."); return; }
        try{
          const saved = await LDT_Core.saveEventsToHistory(state.events || [], { detailsCache: state.detailsCache });
          if (saved && saved.events) { state.events = saved.events; state.csvText = saved.csv || LDT_Core.eventsToCSV(saved.events); }
        }catch(err){ console.error("LDT: failed to save cache before opening standalone", err); }
      }
      if (act==="rescan"){ scheduleRescan(0); }
      if (act==="remote-update"){ const resp=await refreshRemoteData(true); if(resp && resp.ok){ const st=await LDT_Core.loadState(); state.events=LDT_Core.dedupeEvents(st.events || state.events); state.csvText=st.eventsCsv || LDT_Core.eventsToCSV(state.events); LDT_Core.assignThemeRows(state.events); updateViewMode(); } }
      if (act==="export-ics"){ exportSelectedICS(); }
      if (act==="email-log"){ emailSelectedLog(); }
      if (act==="clear-selection"){ state.selectedIds.clear(); updateViewMode(); }
      if (act==="export-events-csv"){
        const text = LDT_Core.eventsToCSV(state.events);
        const url = URL.createObjectURL(new Blob([text],{type:"text/csv"}));
        const a=document.createElement("a"); a.href=url; a.download="neatduck-timeline-events.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      }
      if (act==="toggle-view"){ state.viewMode = state.viewMode==="linear" ? "month" : "linear"; updateViewMode(); }
      if (act==="reset-week"){ const now=Date.now(); state.rangeStart=+LDT_Core.addDays(now,-2); state.rangeEnd=+LDT_Core.addDays(now,5); updateViewMode(); }
      if (act==="reset-month"){ const now=Date.now(); state.rangeStart=+LDT_Core.addDays(now,-7); state.rangeEnd=+LDT_Core.addDays(now,31); updateViewMode(); }
    });
    const mask=document.getElementById("ld-mask");
    mask.addEventListener("click",()=>{ Array.from(document.querySelectorAll(".ld-modal")).forEach(m=>m.style.display="none"); mask.style.display="none"; });
    const langSel=document.getElementById("ld-lang-select");
    if (langSel) langSel.addEventListener("change", async ()=>{ await LDT_Core.saveState({ld_lang: langSel.value}); setLang(langSel.value); });
    const tzSel=document.getElementById("ld-timezone-select");
    if (tzSel) tzSel.addEventListener("change", async ()=>{ state.displayTimeZone=tzSel.value||"local"; await LDT_Core.saveState({ld_display_timezone:state.displayTimeZone}); updateViewMode(); });
    document.querySelectorAll("[data-close='colors']").forEach(b=> b.addEventListener("click", ()=> closeModal("colors") ));
    document.querySelectorAll("[data-close='settings']").forEach(b=> b.addEventListener("click", ()=> closeModal("settings") ));
    document.querySelectorAll("[data-close='updates']").forEach(b=> b.addEventListener("click", ()=> closeModal("updates") ));
  }

  let rescanTimer=null;
  function scheduleRescan(delay=400){
    clearTimeout(rescanTimer);
    rescanTimer=setTimeout(async ()=>{
      const fresh=await scrapeEventsFromDOM();
      // Merge current LeekDuck results into the long-term archive.
      // Active-page scans update known events without deleting old history.
      if (!fresh.length){
        console.warn("LDT: scan returned no events; keeping existing cache instead of wiping it.");
        return;
      }
      const saved = await LDT_Core.saveEventsToHistory(fresh, { detailsCache: state.detailsCache });
      state.events = (saved && saved.events) ? saved.events : LDT_Core.dedupeEvents((state.events || []).concat(fresh));
      state.csvText = (saved && saved.csv) ? saved.csv : LDT_Core.eventsToCSV(state.events);
      LDT_Core.assignThemeRows(state.events);
      updateViewMode();
    }, delay);
  }

  async function init(){
    const wrap=insertUIRoot(); if (!wrap) return;
    const st=await LDT_Core.loadState();
    state.lang=st.lang; state.colors=st.colors; state.settings=LDT_Core.normalizeSettings(st.settings); state.displayTimeZone=st.displayTimeZone||"local"; state.csvText=st.eventsCsv||""; state.detailsCache=st.detailsCache||{}; state.remoteUrl=LDT_Core.normalizeRemoteUrl(st.remoteUrl); applyRenderSettings();
    try {
      const pkURL = chrome.runtime.getURL("assets/pokemon.json");
      state.pokemonDB = await (await fetch(pkURL)).json();
    } catch(e) { console.warn("pokemon.json unavailable", e); }
    setLang(state.lang);
    const remoteResp = await refreshRemoteData(false);
    const st2 = remoteResp && remoteResp.ok ? await LDT_Core.loadState() : st;

    // Storage-first: use the normalized long-term history if present, CSV as fallback.
    if (st2.events && st2.events.length){
      state.events = LDT_Core.dedupeEvents(st2.events);
      state.csvText = LDT_Core.eventsToCSV(state.events);
      LDT_Core.assignThemeRows(state.events);
    } else if ((st2.eventsCsv||state.csvText)){
      state.csvText = st2.eventsCsv || state.csvText;
      state.events = LDT_Core.dedupeEvents(LDT_Core.csvToEvents(state.csvText));
      LDT_Core.assignThemeRows(state.events);
    } else {
      state.events = [];
    }
    // default range
    const now=Date.now();
    if (state.events.length){
      const has = state.events.filter(e=>e.start && (e.endKnown||e.endInferred));
      if (has.length){
        const bounds = currentRangeEventBounds();
        const min = bounds ? bounds.min : Math.min.apply(null, has.map(e=>+e.start));
        const max = bounds ? bounds.max : Math.max.apply(null, has.map(e=>+(e.endKnown||e.endInferred)));
        state.rangeStart = +LDT_Core.addDays(min, -2);
        state.rangeEnd   = +LDT_Core.addDays(max, 5);
      }else{
        state.rangeStart=+LDT_Core.addDays(now,-2); state.rangeEnd=+LDT_Core.addDays(now,5);
      }
    } else {
      state.rangeStart=+LDT_Core.addDays(now,-2); state.rangeEnd=+LDT_Core.addDays(now,5);
    }

    LDT_Core.initInfoPages({state, updateViewMode, getDataUrl:(p)=>chrome.runtime.getURL(p)});
    attachControls();
    attachTimelineInteractions();
    state.viewMode = "linear";
    updateViewMode();

    // Page scraping is now manual via Data Update; GitHub-backed data is preferred on load.
  }

  if (document.readyState==="complete" || document.readyState==="interactive") init();
  else window.addEventListener("DOMContentLoaded", init);
})();
