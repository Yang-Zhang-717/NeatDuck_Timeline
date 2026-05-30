
(() => {
  const Core = {};

  Core.CONST = {
    WIDTH: 1320, HEIGHT: 720, LEGEND_W: 240, TL_W: 1040,
    ITEM_H: 24, ITEM_GAP: 2, GROUP_GAP: 10,
    TOP_RULER_H: 24, BOTTOM_RULER_H: 22,
    TIMELINE_TOP_PAD: 58,
    PERIOD_MONTH_H: 20,
    PERIOD_WEEK_H: 18,
    MIN_SHORT_EVENT_W: 10
  };

  Core.DEFAULT_REMOTE_URL = "https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.csv";
  Core.normalizeRemoteUrl = function(input){
    try{
      const raw = String(input || Core.DEFAULT_REMOTE_URL).trim();
      if (!raw) return Core.DEFAULT_REMOTE_URL;
      const u = new URL(raw);
      if (u.protocol !== "https:") return Core.DEFAULT_REMOTE_URL;
      if (u.hostname === "yang-zhang-717.github.io" && /\/NeatDuck_Timeline\/data\/events\.csv$/i.test(u.pathname)) return Core.DEFAULT_REMOTE_URL;
      const allowed = ["raw.githubusercontent.com", "yang-zhang-717.github.io"];
      if (!allowed.includes(u.hostname)) return Core.DEFAULT_REMOTE_URL;
      return u.toString();
    }catch(_){ return Core.DEFAULT_REMOTE_URL; }
  };
  Core.DEFAULT_SETTINGS = {
    outerMarginX: 0,
    labelPaddingX: 6,
    itemBorderWidth: 1.25,
    itemRadius: 4,
    hoverPersistMs: 2400,
    fontSize: 11,
    fontWeight: 600,
    labelOutline: true,
    minShortEventWidth: 10,
    shadeMaxWidth: 360,
    shadeGap: 2
  };

  Core._usPacificDst = function(year, monthIndex, day){
    // US daylight saving time: second Sunday in March through first Sunday in November.
    const march = new Date(year, 2, 1);
    const secondSundayMarch = 1 + ((7 - march.getDay()) % 7) + 7;
    const november = new Date(year, 10, 1);
    const firstSundayNovember = 1 + ((7 - november.getDay()) % 7);
    if (monthIndex < 2 || monthIndex > 10) return false;
    if (monthIndex > 2 && monthIndex < 10) return true;
    if (monthIndex === 2) return day >= secondSundayMarch;
    return day < firstSundayNovember;
  };

  Core._tzOffsetMinutes = function(tzName, localPartsDate){
    const t = String(tzName || "").toUpperCase();
    if (t === "JST") return 9 * 60;
    if (t === "UTC" || t === "GMT") return 0;
    if (t === "CEST") return 2 * 60;
    if (t === "CET") return 1 * 60;
    if (t === "BST") return 1 * 60;
    if (t === "PDT") return -7 * 60;
    if (t === "PST") return -8 * 60;
    if (t === "PT") {
      const d = localPartsDate || new Date();
      return Core._usPacificDst(d.getFullYear(), d.getMonth(), d.getDate()) ? -7 * 60 : -8 * 60;
    }
    return null;
  };

  Core._reinterpretLocalPartsAsZone = function(d, tzName){
    if (!(d instanceof Date) || isNaN(+d)) return null;
    const off = Core._tzOffsetMinutes(tzName, d);
    if (off == null) return d;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) - off * 60000);
  };

  /* i18n */
  Core.I18N = {
    "en": {"week":"This week","month":"This month","colors":"Colors","language":"Language","legend":"Legend","close":"Close","resetWeek":"This Week","resetMonth":"This Month","editingColors":"Editing category colors","unknownCategory":"Unknown category","addColor":"Pick a color for","saved":"Saved","openStandalone":"Open standalone","exportCSV":"Export CSV","switchLinear":"Timeline","switchMonthGrid":"Month View","home":"Home","today":"Today","names":"Names","importCSV":"Import CSV","exportCSVEvents":"Export Events CSV","dataUpdate":"Data Update","updates":"Updates detected","apply":"Apply","ignore":"Ignore","settings":"Settings","remoteUpdate":"Cloud Update","exportICS":"Export ICS","emailLog":"Email Log","clearSelection":"Clear Selection"},
    "zh-CN":{"week":"本周","month":"本月","colors":"颜色","language":"语言","legend":"图例","close":"关闭","resetWeek":"本周","resetMonth":"本月","editingColors":"编辑类别颜色","unknownCategory":"未知类别","addColor":"请选择颜色：","saved":"已保存","openStandalone":"打开独立页","exportCSV":"导出CSV","switchLinear":"直线时间轴","switchMonthGrid":"月视图","home":"首页","today":"今天","names":"名称","importCSV":"导入CSV","exportCSVEvents":"导出活动CSV","dataUpdate":"数据更新","updates":"检测到更新","apply":"应用","ignore":"忽略","settings":"设置","remoteUpdate":"云端更新","exportICS":"导出日历ICS","emailLog":"邮件日志","clearSelection":"清除选择"},
    "zh-TW":{"week":"本週","month":"本月","colors":"顏色","language":"語言","legend":"圖例","close":"關閉","resetWeek":"本週","resetMonth":"本月","editingColors":"編輯類別顏色","unknownCategory":"未知類別","addColor":"請選擇顏色：","saved":"已儲存","openStandalone":"打開獨立頁","exportCSV":"匯出CSV","switchLinear":"時間軸","switchMonthGrid":"月視圖","home":"首頁","today":"今天","names":"名稱","importCSV":"匯入CSV","exportCSVEvents":"匯出活動CSV","dataUpdate":"資料更新","updates":"偵測到更新","apply":"套用","ignore":"忽略","settings":"設定","remoteUpdate":"雲端更新","exportICS":"匯出日曆ICS","emailLog":"郵件日誌","clearSelection":"清除選取"}
  };
  Core.DEFAULT_LANG = "zh-CN";


  Object.assign(Core.I18N.en, {
    settingsOuterMarginX:"Outer page margin (px)", settingsLabelPaddingX:"Text horizontal padding (px)", settingsItemBorderWidth:"Block border width (px)", settingsItemRadius:"Block corner radius (px)", settingsHoverPersistMs:"Tooltip delay (ms)", settingsFontSize:"Font size (px)", settingsFontWeight:"Font weight", settingsMinShortEventWidth:"Short block minimum width (px)", settingsShadeMaxWidth:"Shading max extension (px)", settingsShadeGap:"Gap before next event (px)", settingsLabelOutline:"White text outline", settingsEnable:"Enable", settingsRemoteUrl:"Remote CSV URL", settingsHint:"Click event blocks to select them. Export uses selected events; if nothing is selected it uses the visible timeline range.", noEventsExport:"No events to export. Select some events or move the timeline to a range with events.", noEmailEvents:"No event log to send. Select some events first.", noCachedEvents:"No cached event data yet. Open leekduck.com/events and wait for scanning, or run Cloud Update.", remoteSuccess:"Cloud data updated.", remoteFail:"Cloud update failed: ", ok:"OK"
  });
  Object.assign(Core.I18N["zh-CN"], {
    settingsOuterMarginX:"左右页边距 px", settingsLabelPaddingX:"文字左右内边距 px", settingsItemBorderWidth:"边框大小 px", settingsItemRadius:"圆角 px", settingsHoverPersistMs:"悬停消失延迟 ms", settingsFontSize:"字体大小 px", settingsFontWeight:"字体粗细", settingsMinShortEventWidth:"短活动最小宽度 px", settingsShadeMaxWidth:"shading 最大延伸 px", settingsShadeGap:"shading 与下个活动间距 px", settingsLabelOutline:"文字白色描边", settingsEnable:"启用", settingsRemoteUrl:"远程 CSV URL", settingsHint:"点击活动块可选择，再导出 ICS 或邮件日志。未选择时默认使用当前时间轴可见范围。", noEventsExport:"没有可导出的活动。先选几个，或者把时间轴移动到有活动的范围。", noEmailEvents:"没有可发送的活动日志。先选几个活动。", noCachedEvents:"没有缓存活动数据：请先打开 leekduck.com/events 等待扫描，或点击云端更新。", remoteSuccess:"云端数据已更新。", remoteFail:"云端更新失败：", ok:"确定"
  });
  Object.assign(Core.I18N["zh-TW"], {
    settingsOuterMarginX:"左右頁邊距 px", settingsLabelPaddingX:"文字左右內邊距 px", settingsItemBorderWidth:"邊框大小 px", settingsItemRadius:"圓角 px", settingsHoverPersistMs:"懸停消失延遲 ms", settingsFontSize:"字體大小 px", settingsFontWeight:"字體粗細", settingsMinShortEventWidth:"短活動最小寬度 px", settingsShadeMaxWidth:"shading 最大延伸 px", settingsShadeGap:"shading 與下個活動間距 px", settingsLabelOutline:"文字白色描邊", settingsEnable:"啟用", settingsRemoteUrl:"遠端 CSV URL", settingsHint:"點擊活動區塊可選取，再匯出 ICS 或郵件日誌。未選取時預設使用目前時間軸可見範圍。", noEventsExport:"沒有可匯出的活動。先選幾個，或把時間軸移到有活動的範圍。", noEmailEvents:"沒有可寄送的活動日誌。先選幾個活動。", noCachedEvents:"沒有快取活動資料：請先開啟 leekduck.com/events 等待掃描，或點擊雲端更新。", remoteSuccess:"雲端資料已更新。", remoteFail:"雲端更新失敗：", ok:"確定"
  });

  Object.assign(Core.I18N.en, {
    tabTimeline:"Activity Timeline", tabTypes:"Type Matchups", tabPokedex:"Pokédex", tabMax:"Dynamax/Gigantamax",
    toggleView:"Toggle View", timezone:"Time Zone", fixedTimeZone:"Fixed time zone", localTime:"Local Time",
    attackView:"Attack view", defenseView:"Defense view", selected:"Selected", strongestInto:"Best targets", weakestTo:"Weakest to", multiplier:"Multiplier",
    search:"Search", typeHint:"Click row headers for attack type and column headers for defender type. Up to two selections are kept in click order."
  });
  Object.assign(Core.I18N["zh-CN"], {
    tabTimeline:"活动 Timeline", tabTypes:"属性克制", tabPokedex:"Pokémon 图鉴", tabMax:"极巨化",
    toggleView:"切换视图", timezone:"时区", fixedTimeZone:"固定时区", localTime:"当地时间",
    attackView:"攻击视角", defenseView:"防守视角", selected:"已选择", strongestInto:"最有效目标", weakestTo:"最怕的攻击", multiplier:"倍率",
    search:"搜索", typeHint:"点击行标题选择攻击属性，点击列标题选择被攻击属性。最多保留两个，按点击顺序计算。"
  });
  Object.assign(Core.I18N["zh-TW"], {
    tabTimeline:"活動 Timeline", tabTypes:"屬性克制", tabPokedex:"Pokémon 圖鑑", tabMax:"極巨化",
    toggleView:"切換視圖", timezone:"時區", fixedTimeZone:"固定時區", localTime:"當地時間",
    attackView:"攻擊視角", defenseView:"防守視角", selected:"已選擇", strongestInto:"最有效目標", weakestTo:"最怕的攻擊", multiplier:"倍率",
    search:"搜尋", typeHint:"點擊列標題選擇攻擊屬性，點擊欄標題選擇被攻擊屬性。最多保留兩個，依點擊順序計算。"
  });

  Core.t = function(lang, key){ const dict = Core.I18N[lang] || Core.I18N.en; return dict[key] || Core.I18N.en[key] || key; };


  Core.DEFAULT_COLORS = {
    "Theme Main": "#27ae60",
    "City Safari": "#3d7141",
    "Community Day": "#1660a9",
    "Theme Event A": "#27ae60",
    "Theme Event B": "#2ecc71",
    "Theme Event C": "#1abc9c",
    "5-Star Raid Battles": "#c0392b",
    "Mega Raid Battles": "#f97316",
    "Raid Day": "#ef6c00",
    "Raid Weekend": "#6f1e51",
    "Max Mondays": "#690342",
    "Shadow Raid Battles": "#4b235f",
    "Pokémon Spotlight Hour": "#e58e26",
    "Raid Hour": "#c0392b",
    "PokéStop Showcase": "#3ca392",
    "GO Pass": "#ddb22f",
    "Season": "#ddb22f",
    "GO Battle League": "#8e44ad"
  };

  Core.LANES_SPEC = [
    { key: "theme",  title: "主题活动 / Theme", sub: ["Theme Main","Theme Event A","Theme Event B","Theme Event C"] },
    { key: "go-pass", title: "GO通行证 / GO Pass", sub: ["GO Pass"] },
    { key: "season",  title: "赛季 / Season", sub: ["Season"] },
    { key: "gbl",     title: "GO对战联盟 / GO Battle League", sub: ["GO Battle League"] },
    { key: "raids",  title: "团体战 / Raids", sub: ["Shadow Raid Battles","Mega Raid Battles","5-Star Raid Battles"], overlays: ["Raid Day","Raid Weekend"] },
    { key: "weekly", title: "每周活动 / Weekly", sub: ["Max Mondays","Raid Hour","Pokémon Spotlight Hour","PokéStop Showcase"] },
    { key: "community", title: "社群日 / Community Day", sub: ["Community Day"] },
    { key: "city", title: "城市探险 / City Safari", sub: ["City Safari"] }
  ];

  Core.STORAGE_SCHEMA_VERSION = 2;

  /* Robust local-time parser to avoid DST/UTC drift and old-cache crashes.
     Accepts Date, number, string, and simple object wrappers from older builds. */
  Core.parseLocalDateString = function(value){
    if (value == null || value === "") return null;

    if (value instanceof Date){
      return isNaN(+value) ? null : new Date(+value);
    }

    if (typeof value === "number"){
      if (!isFinite(value)) return null;
      return new Date(value >= 1e12 ? value : value * 1000);
    }

    if (typeof value === "object"){
      if (typeof value.toISOString === "function"){
        try { const d = new Date(value.toISOString()); return isNaN(+d) ? null : d; } catch(_) {}
      }
      for (const k of ["iso", "date", "value", "time", "start", "end"]){
        if (value[k] != null && value[k] !== value) return Core.parseLocalDateString(value[k]);
      }
    }

    let s = String(value || "").trim();
    if (!s) return null;
    if (/^(null|undefined|nan)$/i.test(s)) return null;

    if (/^\d+$/.test(s)) {
      const n = Number(s);
      if (!isFinite(n)) return null;
      return new Date(s.length >= 12 ? n : n * 1000);
    }

    // ISO / RFC strings with explicit timezone are absolute instants.
    // Important: do not treat the hyphen in "2026-06-02" as a timezone.
    const explicitTZ = /(?:[tT].*(?:[zZ]|[+\-]\d{2}:?\d{2})$)|(?:\s(?:GMT|UTC)\b)|[zZ]$/.test(s);
    if (explicitTZ) {
      const d = new Date(s);
      return isNaN(+d) ? null : d;
    }

    const cleaned = s
      .replace(/\bat\b/ig, " ")
      .replace(/\bLocal\s+Time\b/ig, " ")
      .replace(/(\d)[tT](\d)/, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    // Named real-world zones on LeekDuck detail pages are absolute instants.
    // Local Time remains floating user-local time, so it was removed above and is not converted.
    const namedTZ = cleaned.match(/\b(JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)\b/i);
    if (namedTZ){
      const bare = cleaned.replace(/\b(JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)\b/ig, " ").replace(/\s+/g, " ").trim();
      const bareDate = Core.parseLocalDateString(bare);
      if (bareDate) return Core._reinterpretLocalPartsAsZone(bareDate, namedTZ[1]);
    }

    // e.g. "2026-06-02 10:00", "2026/06/02 10:00", "2026-06-02T10:00".
    let m = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
      const y=+m[1], mo=(+m[2])-1, d=+m[3], hh=+(m[4]||0), mm=+(m[5]||0), ss=+(m[6]||0);
      const out = new Date(y,mo,d,hh,mm,ss,0);
      return isNaN(+out) ? null : out;
    }

    // e.g. "Mon, Jun 1, 2026 8:00 PM" or "Jun 1 8:00 PM".
    const monthMap = {jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,sept:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};
    m = cleaned.match(/(?:\b(?:mon|tue|wed|thu|fri|sat|sun)\w*,?\s*)?\b([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:,?\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
    if (m && Object.prototype.hasOwnProperty.call(monthMap, m[1].toLowerCase())){
      const now = new Date();
      let y = m[3] ? +m[3] : now.getFullYear();
      const mo = monthMap[m[1].toLowerCase()];
      const day = +m[2];
      let hh = +(m[4] || 0), mm = +(m[5] || 0);
      const ap = (m[6] || "").toUpperCase();
      if (ap === "PM" && hh < 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;
      let out = new Date(y, mo, day, hh, mm, 0, 0);
      // For LeekDuck cards without a year, keep upcoming events intuitive around year boundaries.
      if (!m[3] && out < Core.addDays(now, -45)) out = new Date(y + 1, mo, day, hh, mm, 0, 0);
      return isNaN(+out) ? null : out;
    }

    // fallback to Date(), but only after coercing to string.
    const d = new Date(cleaned);
    return isNaN(+d) ? null : d;
  };

  Core.cleanTitle = function(t){
    if (!t) return t;
    t = String(t);
    // Strip section labels, duplicated category badges, and other card text contamination.
    t = t.replace(/\bHappening\s+Now\b/ig, "");
    t = t.replace(/^(Update|Event|Research|Raid Battles|Raid Hour|Raid Day|Max Mondays|Community Day|GO Battle League|GO Pass|Season|Pokémon GO Fest|Pokemon GO Fest)\s+\1\s+/i, "$1 ");
    t = t.replace(/^(Update|Event|Research|Raid Battles|Raid Hour|Raid Day|Max Mondays|Community Day|GO Battle League|GO Pass|Season|Pokémon GO Fest|Pokemon GO Fest)\s+(?=\S)/i, (m) => m.trim() + " ");
    t = t.replace(/\bCalculating\.\.\./ig, "");
    t = t.replace(/\b(?:Starts|Ends):\s*\d+\s*days?\s*\d+\s*hours?\s*\d+\s*min\b/ig, "");
    t = t.replace(/\s{2,}/g, " ").trim();
    t = t.replace(/[:\-–—]\s*$/," ").trim();
    return t;
  };

  Core.shortenWeekly = function(raw){
    let s = Core.cleanTitle(raw||"");
    // Dynamax XXX during Max Monday(s)
    s = s.replace(/Dynamax\s+(.+?)\s+during\s+Max\s+Monday(?:s)?/i, "$1");
    // Spotlight Hour / Raid Hour / Showcase
    s = s.replace(/(.+?)\s+Spotlight\s+Hour/i, "$1");
    s = s.replace(/(.+?)\s+Raid\s+Hour/i, "$1");
    s = s.replace(/(.+?)\s+Pok[eé]Stop\s+Showcases?/i, "$1");
    s = s.replace(/(.+?)聚焦時刻/,"$1");
    s = s.replace(/(.+?)團體戰時刻/,"$1");
    s = s.replace(/(.+?)補給站展示/,"$1");
    return s.trim();
  };

  Core.shortenRaids = function(raw){
    let s = Core.cleanTitle(raw||"");
    // "Mega XXX in Mega Raids" -> "Mega XXX"
    s = s.replace(/\s+in\s+Mega\s+Raids?/i, "");
    s = s.replace(/\s+in\s+Shadow\s+(?:Raids?|Raid\s+Battles?)/i, "");
    // "... in 5-Star Raid Battles" -> "..."
    s = s.replace(/\s+in\s+5-?\s*Star\s+Raid\s+Battles/i, "");
    // Mega Raid Day/Weekend suffixes
    s = s.replace(/\s*Mega\s+Raid\s+(Day|Weekend)\s*:?\s*(.*)$/i, "Mega $2".trim());
    return s.trim();
  };

  Core.shortenGBL = function(raw){
    return Core.cleanTitle(raw||"").replace(/\bGreat League\b/g, "GL").replace(/\bUltra League\b/g, "UL").replace(/\bMaster League\b/g, "ML");
  };

  Core.chooseLaneAndSub = function(e){
    const text = (e.rawText||"") + " " + (e.title||"") + " " + (e.category||"");
    // Weekly
    const wk=[
      {sub:"Max Mondays",re:/(max\s*monday|max\s*mondays)/i},
      {sub:"Pokémon Spotlight Hour",re:/(spotlight\s*hour|聚焦時刻)/i},
      {sub:"Raid Hour",re:/(raid\s*hour|團體戰時刻)/i},
      {sub:"PokéStop Showcase",re:/(pok[eé]stop\s*showcase|補給站展示)/i}
    ];
    for (const w of wk){ if (w.re.test(text)) return {lane:"weekly",sub:w.sub}; }

    if (/(go\s*battle\s*league|^gbl\b)/i.test(text)) return { lane:"gbl", sub:"GO Battle League" };

    const isRaidDay = /(raid\s*day)/i.test(text);
    const isRaidWeekend = /(raid\s*weekend)/i.test(text);
    const isMega = /(mega\s+raid)/i.test(text) || /mega\s+raid\s*(day|weekend)/i.test(text);
    const isShadowRaid = /(shadow\s+(?:raid|raids|raid\s*battles)|暗影.*(?:团体战|團體戰))/i.test(text);
    const isFiveStar = /(5-?star\s+raid|legendary\s+raid)/i.test(text) || /(?:傳說|传说).*團體戰|(?:傳說|传说).*团体战/.test(text);
    if (isRaidDay || isRaidWeekend || isMega || isShadowRaid || isFiveStar){
      const overlay = (isRaidDay || isRaidWeekend) ? (isRaidDay ? "Raid Day" : "Raid Weekend") : null;
      const baseSub = isShadowRaid ? "Shadow Raid Battles" : (isMega ? "Mega Raid Battles" : "5-Star Raid Battles");
      return { lane:"raids", sub: baseSub, overlay, overlayTargetSub: baseSub };
    }
    if (/(go\s*pass)/i.test(text)) return {lane:"go-pass",sub:"GO Pass"};
    if (/(season)/i.test(text)) return {lane:"season",sub:"Season"};
    if (/(go\s*tour|go\s*fest|wild\s*area)/i.test(text)) return { lane:"theme", sub:"Theme Main" };
    if (/(city\s*safari)/i.test(text)) return { lane:"city", sub:"City Safari" };
    if (/(community\s*day)/i.test(text)) return { lane:"community", sub:"Community Day" };
    return { lane:"theme", sub:"Theme Event A" }; // generic theme goes to A/B/C later
  };

  Core.canonicalizeLaneSub = function(laneSub){
    const out = {...(laneSub || {})};
    const sub = out.sub || "";
    if (["Theme Main","Theme Event A","Theme Event B","Theme Event C"].includes(sub)) out.lane = "theme";
    else if (sub === "GO Pass") out.lane = "go-pass";
    else if (sub === "Season") out.lane = "season";
    else if (sub === "GO Battle League") out.lane = "gbl";
    else if (["Shadow Raid Battles","Mega Raid Battles","5-Star Raid Battles"].includes(sub)) out.lane = "raids";
    else if (["Max Mondays","Raid Hour","Pokémon Spotlight Hour","PokéStop Showcase"].includes(sub)) out.lane = "weekly";
    else if (sub === "Community Day") out.lane = "community";
    else if (sub === "City Safari") out.lane = "city";
    return out;
  };

  Core.assignThemeRows = function(events){
    const rows=[[],[],[]]; // A/B/C
    const items = events.filter(e => e.lane==="theme" && /Theme Event [ABC]/.test(e.sub)).sort((a,b)=>(+a.start)-(+b.start));
    const endOf = e => (e.endKnown||e.endInferred||e.start||0);
    for (const ev of items){
      // place into first row whose last end <= start, else the row with earliest end
      let chosen = 0, found=false;
      for (let i=0;i<3;i++){
        const last = rows[i][rows[i].length-1];
        if (!last || endOf(last) <= ev.start){ chosen=i; found=true; break; }
      }
      if (!found){
        chosen = rows[0] && rows[1] && (endOf(rows[0][rows[0].length-1]) <= endOf(rows[1][rows[1].length-1])) ? 0 : 1;
        if (rows[2] && endOf(rows[2][rows[2].length-1]) < endOf(rows[chosen][rows[chosen].length-1])) chosen=2;
      }
      ev.sub = ["Theme Event A","Theme Event B","Theme Event C"][chosen];
      rows[chosen].push(ev);
    }
  };

  Core.fmt = function(dt){ if (!dt) return ""; const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), d=String(dt.getDate()).padStart(2,'0'), hh=String(dt.getHours()).padStart(2,'0'), mm=String(dt.getMinutes()).padStart(2,'0'); return `${y}-${m}-${d} ${hh}:${mm}`; };
  Core.beginOfDay = d => { const dd=new Date(d); dd.setHours(0,0,0,0); return dd; };
  Core.endOfDay   = d => { const dd=new Date(d); dd.setHours(23,59,59,999); return dd; };
  Core.addDays    = (d,n)=>{ const dd=new Date(d); dd.setDate(dd.getDate()+n); return dd; };
  Core.addHours   = (d,n)=>{ const dd=new Date(d); dd.setHours(dd.getHours()+n); return dd; };
  Core.isWeekend  = d => { const day=d.getDay(); return (day===0||day===6); };
  Core.isRangeOverNdays = (start,end,n)=> ((end-start)/86400000 >= n);
  Core.mondayOfWeek = function(d){ const dd=new Date(d); const day=dd.getDay(); const diff=(day===0?-6:1-day); dd.setDate(dd.getDate()+diff); dd.setHours(0,0,0,0); return dd; };
  Core.monthStart = function(d){ const dd=new Date(d); dd.setDate(1); dd.setHours(0,0,0,0); return dd; };
  Core.nextMonthStart = function(d){ const dd=Core.monthStart(d); dd.setMonth(dd.getMonth()+1); return dd; };


  /* Localization, Pokémon names, readable labels, and contrast */
  Core.CATEGORY_LABELS = {
    "en": {
      "Theme Main":"Theme Event", "Theme Event A":"Theme Event", "Theme Event B":"Theme Event", "Theme Event C":"Theme Event",
      "City Safari":"City Safari", "Community Day":"Community Day", "5-Star Raid Battles":"5-Star Raids", "Mega Raid Battles":"Mega Raids", "Shadow Raid Battles":"Shadow Raids",
      "Raid Day":"Raid Day", "Raid Weekend":"Raid Weekend", "Max Mondays":"Max Mondays", "Pokémon Spotlight Hour":"Spotlight Hour",
      "Raid Hour":"Raid Hour", "PokéStop Showcase":"PokéStop Showcase", "GO Pass":"GO Pass", "Season":"Season", "GO Battle League":"GO Battle League"
    },
    "zh-CN": {
      "Theme Main":"主题活动", "Theme Event A":"主题活动", "Theme Event B":"主题活动", "Theme Event C":"主题活动",
      "City Safari":"城市探险", "Community Day":"社群日", "5-Star Raid Battles":"五星团体战", "Mega Raid Battles":"超级团体战", "Shadow Raid Battles":"暗影团体战",
      "Raid Day":"团体战日", "Raid Weekend":"团体战周末", "Max Mondays":"极巨星期一", "Pokémon Spotlight Hour":"聚焦时刻",
      "Raid Hour":"团体战时刻", "PokéStop Showcase":"宝可梦补给站选秀", "GO Pass":"GO通行证", "Season":"赛季", "GO Battle League":"GO对战联盟"
    },
    "zh-TW": {
      "Theme Main":"主題活動", "Theme Event A":"主題活動", "Theme Event B":"主題活動", "Theme Event C":"主題活動",
      "City Safari":"城市探險", "Community Day":"社群日", "5-Star Raid Battles":"五星團體戰", "Mega Raid Battles":"超級團體戰", "Shadow Raid Battles":"暗影團體戰",
      "Raid Day":"團體戰日", "Raid Weekend":"團體戰週末", "Max Mondays":"極巨星期一", "Pokémon Spotlight Hour":"聚焦時刻",
      "Raid Hour":"團體戰時刻", "PokéStop Showcase":"寶可補給站選秀", "GO Pass":"GO通行證", "Season":"季節", "GO Battle League":"GO對戰聯盟"
    }
  };

  Core.localizeCategoryLabel = function(label, lang){
    const dict = Core.CATEGORY_LABELS[lang] || Core.CATEGORY_LABELS[Core.DEFAULT_LANG] || Core.CATEGORY_LABELS.en;
    return (dict && dict[label]) || label;
  };

  Core.relativeLuminance = function(cssColor){
    try{
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.fillStyle = cssColor || "#999999";
      let c = ctx.fillStyle;
      let m = String(c).match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      let r,g,b;
      if (m){
        let hex=m[1];
        if(hex.length===3) hex=hex.split("").map(ch=>ch+ch).join("");
        r=parseInt(hex.slice(0,2),16); g=parseInt(hex.slice(2,4),16); b=parseInt(hex.slice(4,6),16);
      } else {
        m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if(!m) return 1;
        r=+m[1]; g=+m[2]; b=+m[3];
      }
      const srgb=[r,g,b].map(v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
      return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
    }catch(_){ return 1; }
  };
  Core.contrastTextColor = function(cssColor){ return Core.relativeLuminance(cssColor) < 0.43 ? "#fff" : "#111"; };


  Core.normalizeSettings = function(settings){
    const d = Core.DEFAULT_SETTINGS;
    const s = {...d, ...(settings || {})};
    const numberKeys = ["outerMarginX","labelPaddingX","itemBorderWidth","itemRadius","hoverPersistMs","fontSize","fontWeight","minShortEventWidth","shadeMaxWidth","shadeGap"];
    numberKeys.forEach(k => {
      const v = Number(s[k]);
      s[k] = isFinite(v) ? v : d[k];
    });
    s.outerMarginX = Math.max(0, Math.min(80, s.outerMarginX));
    s.labelPaddingX = Math.max(0, Math.min(24, s.labelPaddingX));
    s.itemBorderWidth = Math.max(0, Math.min(6, s.itemBorderWidth));
    s.itemRadius = Math.max(0, Math.min(16, s.itemRadius));
    s.hoverPersistMs = Math.max(300, Math.min(12000, s.hoverPersistMs));
    s.fontSize = Math.max(8, Math.min(20, s.fontSize));
    s.fontWeight = Math.max(300, Math.min(900, s.fontWeight));
    s.minShortEventWidth = Math.max(4, Math.min(120, s.minShortEventWidth));
    s.shadeMaxWidth = Math.max(0, Math.min(420, s.shadeMaxWidth));
    s.shadeGap = Math.max(0, Math.min(20, s.shadeGap));
    s.labelOutline = !!s.labelOutline;
    return s;
  };

  Core.escapeHTML = function(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  };

  Core.safeHref = function(value){
    try{
      const u = new URL(String(value || ""), "https://leekduck.com");
      if (!/^https?:$/i.test(u.protocol)) return "";
      return u.toString();
    }catch(_){ return ""; }
  };

  Core.visibleEventsInRange = function(events, rangeStart, rangeEnd){
    return Core.dedupeEvents(events || []).filter(e => {
      const start = Core.parseLocalDateString(e.start);
      const end = Core.parseLocalDateString(e.endKnown || e.endInferred);
      return start && end && +end >= rangeStart && +start <= rangeEnd;
    });
  };

  Core.eventsToTextLog = function(events, lang, pokemonDB){
    return Core.dedupeEvents(events || []).map(e => {
      const start = Core.parseLocalDateString(e.start);
      const end = Core.parseLocalDateString(e.endKnown || e.endInferred);
      const name = Core.localizeEventTitle(e, lang || Core.DEFAULT_LANG, pokemonDB);
      const cat = Core.localizeCategoryLabel(e.sub || e.category || "", lang || Core.DEFAULT_LANG);
      const url = Core.safeHref(e.href || "");
      return [`${name}`, `时间: ${Core.fmt(start)} → ${Core.fmt(end)}`, `类别: ${cat}`, url ? `链接: ${url}` : ""].filter(Boolean).join("\n");
    }).join("\n\n---\n\n");
  };

  Core.eventsToICS = function(events, lang, pokemonDB){
    const dt = d => {
      const x = Core.parseLocalDateString(d) || new Date();
      return x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    };
    const esc = v => String(v == null ? "" : v).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//NeatDuck_Timeline//Event Log//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
    Core.dedupeEvents(events || []).forEach(e => {
      const start = Core.parseLocalDateString(e.start);
      const end = Core.parseLocalDateString(e.endKnown || e.endInferred);
      if(!start || !end) return;
      const title = Core.localizeEventTitle(e, lang || Core.DEFAULT_LANG, pokemonDB);
      const url = Core.safeHref(e.href || "");
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + esc((e.id || Core.makeEventId(e) || Core._stringHash(title + start)) + "@neatduck-timeline"));
      lines.push("DTSTAMP:" + dt(new Date()));
      lines.push("DTSTART:" + dt(start));
      lines.push("DTEND:" + dt(end));
      lines.push("SUMMARY:" + esc(title));
      lines.push("DESCRIPTION:" + esc([Core.localizeCategoryLabel(e.sub || e.category || "", lang || Core.DEFAULT_LANG), url].filter(Boolean).join("\\n")));
      if(url) lines.push("URL:" + esc(url));
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };

  Core._pokemonManual = {
    "frigibax": {"zh-CN":"凉脊龙","zh-TW":"涼脊龍","ja":"セビエ"},
    "arctibax": {"zh-CN":"冻脊龙","zh-TW":"凍脊龍","ja":"セゴール"},
    "baxcalibur": {"zh-CN":"戟脊龙","zh-TW":"戟脊龍","ja":"セグレイブ"}
  };

  Core._pokemonKey = function(name){
    return String(name||"").toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9\s\.\-']/g," ").replace(/\s+/g," ").trim();
  };
  Core.translatePokemonName = function(englishName, lang, pokemonDB){
    if(!englishName || !pokemonDB) return null;
    const original = String(englishName).trim();
    let prefix = "";
    let keyName = original;
    if (/^Shadow\s+/i.test(keyName)) { prefix = (lang==="zh-TW"?"暗影":(lang==="zh-CN"?"暗影":"Shadow ")); keyName = keyName.replace(/^Shadow\s+/i, ""); }
    if (/^Mega\s+/i.test(keyName)) { prefix += (lang==="zh-TW"?"超級·":(lang==="zh-CN"?"超级·":"Mega ")); keyName = keyName.replace(/^Mega\s+/i, ""); }
    if (/^Dynamax\s+/i.test(keyName)) { prefix += (lang==="zh-TW"?"極巨":"zh-CN"===lang?"极巨":"Dynamax "); keyName = keyName.replace(/^Dynamax\s+/i, ""); }
    const key = Core._pokemonKey(keyName);
    const manual = Core._pokemonManual[key];
    if (manual && manual[lang]) return prefix + manual[lang];
    const colMap = {
      "en": ["Name","English","EN","Pokemon","Pokémon","Eng","en"],
      "zh-CN": ["简中","Chinese (Simplified)","CN","简体中文","中文（简体）","zh-CN","zh_cn"],
      "zh-TW": ["繁中","Chinese (Traditional)","TW","繁體中文","中文（繁體）","zh-TW","zh_tw"],
      "ja": ["日文","Japanese","JP","日本語","ja","jp"]
    };
    const enCols = colMap.en;
    let rows = [];
    const hinted = pokemonDB.index_hint && pokemonDB.index_hint[key];
    if (hinted) rows.push(hinted);
    rows = rows.concat((pokemonDB.rows||[]).filter(r => enCols.some(c => Core._pokemonKey(r[c]) === key)));
    for(const row of rows){
      for(const c of (colMap[lang] || [])){
        const v = row[c];
        if (v && String(v).trim()) return prefix + String(v).trim();
      }
    }
    for(const row of rows){
      for(const c of enCols){
        const v = row[c];
        if (v && String(v).trim()) return prefix + String(v).trim();
      }
    }
    return null;
  };

  Core.extractPokemonName = function(title){
    let s = Core.cleanTitle(title||"");
    s = s.replace(/\s*\|\s*.*$/i, "");
    s = s.replace(/\s+in\s+(?:5[- ]?star|five[- ]?star|legendary|mega|shadow)\s+(?:raid|raids|raid battles|battles).*$/i, "");
    s = s.replace(/\s+(?:5[- ]?star|legendary|mega|shadow)\s+(?:raid|raids|raid battles|battles).*$/i, "");
    s = s.replace(/\s+during\s+Max\s+Monday(?:s)?\b.*$/i, "");
    s = s.replace(/\s+(?:Spotlight\s+Hour|Raid\s+Hour|Raid\s+Day|Raid\s+Weekend|Pok[eé]Stop\s+Showcases?).*$/i, "");
    s = s.replace(/\s+Battles?$/i, "");
    s = s.replace(/^Dynamax\s+/i, "");
    return s.trim();
  };

  Core.localizeEventTitle = function(e, lang, pokemonDB){
    const l = lang || Core.DEFAULT_LANG;
    let raw = Core.cleanTitle((e && (e.shortTitle || e.title)) || "");
    if(!e) return raw;
    const sub = e.sub || "";
    const isPokemonOnly = /^(5-Star Raid Battles|Mega Raid Battles|Shadow Raid Battles|Max Mondays|Pokémon Spotlight Hour|Raid Hour|PokéStop Showcase)$/i.test(sub);
    if (isPokemonOnly){
      let pokemon = Core.extractPokemonName(e.title || raw);
      if (sub === "Mega Raid Battles" && !/^Mega\s+/i.test(pokemon)) pokemon = "Mega " + pokemon;
      const local = (l === "en") ? pokemon.replace(/^Dynamax\s+/i, "") : (Core.translatePokemonName(pokemon, l, pokemonDB) || pokemon);
      if (sub === "Max Mondays") return /^Max\b/i.test(local) ? local : "Max " + local;
      if (sub === "Pokémon Spotlight Hour") return l === "en" ? `${local} Spotlight Hour` : local + (l==="zh-TW"?"聚焦時刻":"聚焦时刻");
      if (sub === "Raid Hour") return l === "en" ? `${local} Raid Hour` : local + (l==="zh-TW"?"團體戰時刻":"团体战时刻");
      if (sub === "PokéStop Showcase") return l === "en" ? `${local} Showcase` : local + (l==="zh-TW"?"補給站選秀":"补给站选秀");
      return local.replace(/\s+Battles?$/i, "");
    }
    if(l === "en") return raw.replace(/\s+Battles?$/i, "");
    if (sub === "GO Battle League"){
      return raw.replace(/\bGreat League\b/g, "GL").replace(/\bUltra League\b/g, "UL").replace(/\bMaster League\b/g, "ML").replace(/\bTales of Transformation\b/g, l==="zh-TW"?"變幻物語":"变幻物语");
    }
    return raw
      .replace(/\bCommunity Day\b/g, l==="zh-TW"?"社群日":"社群日")
      .replace(/\bRaid Day\b/g, l==="zh-TW"?"團體戰日":"团体战日")
      .replace(/\bRaid Weekend\b/g, l==="zh-TW"?"團體戰週末":"团体战周末")
      .replace(/\bGO Pass\b/g, "GO通行证")
      .replace(/\bTales of Transformation\b/g, l==="zh-TW"?"變幻物語":"变幻物语")
      .replace(/\bShadow\b/g, "暗影");
  };

  Core._normalizeDatePhrase = function(text){
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/[–—]/g, "-")
      .replace(/a\.m\./ig, "AM")
      .replace(/p\.m\./ig, "PM")
      .replace(/\bat\b/ig, " ")
      .replace(/\bLocal\s+Time\b/ig, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  Core._parseDetailPhraseDate = function(text, fallbackYear, inheritedTZ){
    let s = Core._normalizeDatePhrase(text);
    if (!s || /^Calculating/i.test(s)) return null;
    const explicitTZ = (s.match(/\b(JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)\b/i) || [])[1] || null;
    if (inheritedTZ && !explicitTZ) s = (s + " " + inheritedTZ).trim();
    let d = Core.parseLocalDateString(s);
    if (d && fallbackYear && !/\b\d{4}\b/.test(s)) {
      const zone = explicitTZ || inheritedTZ;
      if (zone) {
        const rebuilt = s.replace(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?!,?\s*\d{4})/i, "$1 $2, " + fallbackYear);
        const rebuiltDate = Core.parseLocalDateString(rebuilt);
        if (rebuiltDate) d = rebuiltDate;
      } else {
        d.setFullYear(fallbackYear);
      }
    }
    return d;
  };

  Core._parseDetailTextDates = function(rawText){
    const text = Core._normalizeDatePhrase(rawText || "");
    const out = {start:null, end:null};
    if (!text) return out;

    function finish(a,b){ if(a) out.start=a; if(b) out.end=b; return out; }
    function inheritedTZ(a,b){ return (((a || "") + " " + (b || "")).match(/\b(JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)\b/i) || [])[1] || null; }
    function yearOf(a,b){ const m = (((a || "") + " " + (b || "")).match(/\b(20\d{2})\b/) || [])[1]; return m ? +m : null; }

    // "Dates: May 29-June 1, 2026 Time: 10:00 AM - 8:00 PM JST"
    // Check this before generic "from ... to ..." snippets so ticket-bonus hours do not override the real event range.
    let m = text.match(/Dates:\s*([A-Za-z]+\s+\d{1,2})\s*-\s*([A-Za-z]+\s+\d{1,2}),?\s*(20\d{2})(?:\s+Time:\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(JST|PDT|PST|PT|CEST|CET|BST|UTC|GMT)?)?/i);
    if (m){
      const y = +m[3];
      const tz = m[6] || null;
      const startPhrase = `${m[1]}, ${y}${m[4] ? " " + m[4] : " 12:00 AM"}${tz ? " " + tz : ""}`;
      const endPhrase = `${m[2]}, ${y}${m[5] ? " " + m[5] : " 11:59 PM"}${tz ? " " + tz : ""}`;
      const a = Core._parseDetailPhraseDate(startPhrase, y, tz);
      const b = Core._parseDetailPhraseDate(endPhrase, y, tz);
      if (a || b) return finish(a,b);
    }

    // "will run from May 26, 2026, at 1:00 PM to June 2, 2026, at 1:00 PM PT"
    m = text.match(/(?:will\s+run\s+)?from\s+(.+?)\s+to\s+(.+?)(?:\.| Trainers\b|$)/i);
    if (m){
      const hasRealDate = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i.test(m[1] + " " + m[2]);
      if (hasRealDate){
        const tz = inheritedTZ(m[1], m[2]);
        const y = yearOf(m[1], m[2]);
        const a = Core._parseDetailPhraseDate(m[1], y, tz);
        const b = Core._parseDetailPhraseDate(m[2], y || (a ? a.getFullYear() : null), tz);
        if (a || b) return finish(a,b);
      }
    }

    // "on Saturday, May 30, at 6:00 PM PDT until Sunday, May 31, at 6:00 PM PDT"
    m = text.match(/\bon\s+(.+?)\s+until\s+(.+?)(?:\.|$)/i);
    if (m){
      const tz = inheritedTZ(m[1], m[2]);
      const y = yearOf(text, "");
      const a = Core._parseDetailPhraseDate(m[1], y, tz);
      const b = Core._parseDetailPhraseDate(m[2], y || (a ? a.getFullYear() : null), tz);
      if (a || b) return finish(a,b);
    }

    // Ticket-holder single-day bonuses like "from 12:01 AM to 11:59 PM" are ignored unless paired with a Dates: line above.
    return out;
  };

  Core.parseEventDetailHTML = function(html){
    try{
      const doc = new DOMParser().parseFromString(html, "text/html");
      function parseByIds(dateSel, timeSel){
        const dateEl = doc.querySelector(dateSel);
        const timeEl = doc.querySelector(timeSel);
        const dateAttr = dateEl && (dateEl.getAttribute("data-event-page-date") || dateEl.getAttribute("data-event-page-data") || dateEl.textContent || "");
        const timeAttr = timeEl && (timeEl.getAttribute("data-event-page-time") || timeEl.getAttribute("datetime") || timeEl.textContent || "");
        const combined = Core._normalizeDatePhrase(`${dateAttr || ""} ${timeAttr || ""}`);
        if (!combined || /^Calculating/i.test(combined)) return null;
        return Core.parseLocalDateString(combined);
      }
      let start = parseByIds("#event-date-start", "#event-time-start");
      let end   = parseByIds("#event-date-end", "#event-time-end");
      if(!start) start = parseByIds("#start-text span[data-event-page-date], #start-text span[data-event-page-data]", "#start-text span[data-event-page-time]");
      if(!end)   end   = parseByIds("#end-text span[data-event-page-date], #end-text span[data-event-page-data]", "#end-text span[data-event-page-time]");

      const raw = (doc.body && doc.body.textContent || "").replace(/\u00a0/g, " ");
      const lines = raw.split(/[\r\n]+/).map(x=>Core._normalizeDatePhrase(x)).filter(Boolean);
      function nextAfter(label){
        const re = new RegExp("^" + label + "\\s*:?(?:\\s+(.*))?$", "i");
        for (let i=0;i<lines.length;i++){
          const m = lines[i].match(re);
          if (!m) continue;
          if (m[1] && m[1].trim() && !/^Calculating/i.test(m[1])) return m[1].trim();
          for (let j=i+1;j<Math.min(lines.length, i+6);j++){
            const v = lines[j].trim();
            if (!v || /^\*+$/.test(v) || /^[-]+$/.test(v)) continue;
            if (/^Calculating/i.test(v)) continue;
            if (/^(Starts|Ends):?/i.test(v)) break;
            return v;
          }
        }
        return "";
      }
      const startText = nextAfter("Starts");
      const endText = nextAfter("Ends");
      if(!start && startText) start = Core._parseDetailPhraseDate(startText);
      if(!end && endText) end = Core._parseDetailPhraseDate(endText, start ? start.getFullYear() : null);

      if(!start || !end){
        const guessed = Core._parseDetailTextDates(raw);
        if(!start && guessed.start) start = guessed.start;
        if(!end && guessed.end) end = guessed.end;
      }
      if (start && end && end < start) {
        // Year-rollover guard for ranges like Dec 31-Jan 1 that omit the second year.
        const fixed = new Date(end); fixed.setFullYear(start.getFullYear()+1);
        if (fixed > start) end = fixed;
      }
      return { start, end };
    }catch(_){ return { start:null, end:null }; }
  };

  /* CSV <-> events */
  Core.eventsToCSV = function(events){
    const header = ["title","shortTitle","category","lane","sub","start","endKnown","endInferred","href"].join(",");
    const rows = events.map(e => [
      JSON.stringify(e.title||""), JSON.stringify(e.shortTitle||""), JSON.stringify(e.category||""),
      JSON.stringify(e.lane||""), JSON.stringify(e.sub||""),
      JSON.stringify(e.start? new Date(e.start).toISOString():""),
      JSON.stringify(e.endKnown? new Date(e.endKnown).toISOString():""),
      JSON.stringify(e.endInferred? new Date(e.endInferred).toISOString():""),
      JSON.stringify(e.href||"")
    ].join(","));
    return [header].concat(rows).join("\n");
  };

  Core._splitCsvLine = function(line){
    const cols=[];
    let cur="", inQuote=false, escaped=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (escaped){ cur += ch; escaped=false; continue; }
      if (inQuote && ch==="\\"){ cur += ch; escaped=true; continue; }
      if (ch==='"'){ inQuote=!inQuote; cur += ch; continue; }
      if (ch==="," && !inQuote){ cols.push(cur); cur=""; continue; }
      cur += ch;
    }
    cols.push(cur);
    return cols;
  };

  Core._safeJsonField = function(v, fallback=""){
    if (v==null || v==="") return fallback;
    try { return JSON.parse(v); }
    catch(_){
      try { return String(v).replace(/^"/,"").replace(/"$/ ,"").replace(/\\"/g, '"'); }
      catch(__){ return fallback; }
    }
  };

  Core.csvToEvents = function(text){
    if (!text) return [];
    const lines = String(text).split(/\r?\n/).filter(x=>x.trim().length>0);
    if (lines.length<=1) return [];
    const header = Core._splitCsvLine(lines[0]).map(h => String(h).replace(/(^"|"$)/g,""));
    const idx = {};
    header.forEach((h,i)=> idx[h] = i);
    const required = ["title","shortTitle","category","lane","sub","start","endKnown","endInferred","href"];
    if (!required.every(k => Object.prototype.hasOwnProperty.call(idx,k))){
      console.warn("LDT: CSV header not recognized; ignoring imported cache.");
      return [];
    }
    const parseDateField = (cols,key)=>{
      const raw = cols[idx[key]];
      const val = Core._safeJsonField(raw, "");
      return Core.parseLocalDateString(val);
    };
    const events=[];
    for (let i=1;i<lines.length;i++){
      try{
        const cols = Core._splitCsvLine(lines[i]);
        const e = {
          title: Core._safeJsonField(cols[idx["title"]], ""),
          shortTitle: Core._safeJsonField(cols[idx["shortTitle"]], ""),
          category: Core._safeJsonField(cols[idx["category"]], ""),
          lane: Core._safeJsonField(cols[idx["lane"]], ""),
          sub: Core._safeJsonField(cols[idx["sub"]], ""),
          start: parseDateField(cols,"start"),
          endKnown: parseDateField(cols,"endKnown"),
          endInferred: parseDateField(cols,"endInferred"),
          href: Core._safeJsonField(cols[idx["href"]], "")
        };
        if (!e.title && !e.href) continue;
        const normalized = Core.normalizeLegacyEvent(e);
        if (normalized) events.push(normalized);
      }catch(err){
        console.warn("LDT: skipped bad CSV row", i+1, err);
      }
    }
    return events;
  };

  Core.hashColor = function(str){ let h=0; str=String(str||""); for (let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0; } const hue=Math.abs(h)%360; return `hsl(${hue},60%,55%)`; };

  Core._stringHash = function(str){
    str = String(str || "");
    let h = 2166136261;
    for (let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  };

  Core._safeId = function(str){
    try { return btoa(unescape(encodeURIComponent(str))).replace(/=+$/g, "").replace(/[+/]/g, "_"); }
    catch(_) { return "h_" + Core._stringHash(str); }
  };

  Core.normalizeHref = function(href){
    if (!href) return "";
    let s = String(href || "").trim();
    if (!s) return "";
    try{
      const base = (typeof location !== "undefined" && location.origin) ? location.origin : "https://leekduck.com";
      const u = new URL(s, base);
      u.hash = "";
      for (const k of Array.from(u.searchParams.keys())){
        if (/^(utm_|fbclid|gclid|mc_|ts$)/i.test(k)) u.searchParams.delete(k);
      }
      return u.toString().replace(/\/$/, "");
    }catch(_){
      return s.split("#")[0].replace(/[?&](utm_[^=&]+|fbclid|gclid|ts)=[^&]*/ig, "").replace(/\/$/, "");
    }
  };

  Core._dayKey = function(d){
    const dd = Core.parseLocalDateString(d);
    if (!dd) return "";
    return `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;
  };

  Core.eventIdentityKey = function(e){
    e = e || {};
    const href = Core.normalizeHref(e.href || e.url || "");
    if (href) return "href:" + href;
    const title = Core.cleanTitle(e.title || e.nameOriginal || e.nameDisplay || "").toLowerCase().replace(/\s+/g," ").trim();
    const cat = String(e.category || e.categoryLabel || e.categoryKey || e.sub || e.lane || "").toLowerCase().replace(/\s+/g," ").trim();
    const day = Core._dayKey(e.start || e.startISO || "");
    return `fallback:${title}|${cat}|${day}`;
  };

  Core.makeEventId = function(e){ return Core._safeId(Core.eventIdentityKey(e)); };

  Core.toISODate = function(v){
    const d = Core.parseLocalDateString(v);
    return d ? d.toISOString() : null;
  };

  Core.normalizeLegacyEvent = function(e){
    if (!e || typeof e !== "object") return null;
    try{
      let title = e.title || e.nameOriginal || e.nameDisplay || "";
      const category = e.category || e.categoryLabel || e.categoryKey || "";
      if (category && typeof title === "string"){
        const c = String(category).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        title = title.replace(new RegExp("^(?:" + c + ")(?:\\s+" + c + ")?\\s+", "i"), "");
      }
      const start = Core.parseLocalDateString(e.startISO || e.start);
      const endKnown = Core.parseLocalDateString(e.endISO || e.endKnown || e.end);
      const endInferred = Core.parseLocalDateString(e.endInferred);
      const href = Core.normalizeHref(e.href || e.url || "");
      const out = {
        title: Core.cleanTitle(title),
        category,
        rawText: e.rawText || [title, category, e.categoryKey || ""].join(" "),
        href,
        start,
        endKnown,
        endInferred,
        isLocal: e.isLocal !== false,
        firstSeenAt: e.firstSeenAt || e.createdAt || null,
        lastSeenAt: e.lastSeenAt || e.updatedAt || null,
        status: e.status || "saved"
      };
      let mapped = null;
      if (e.categoryKey){
        const m = {
          raids_5: ["raids","5-Star Raid Battles"], raids_mega: ["raids","Mega Raid Battles"], raids_shadow: ["raids","Shadow Raid Battles"],
          max_monday: ["weekly","Max Mondays"], spotlight: ["weekly","Pokémon Spotlight Hour"], raid_hours: ["weekly","Raid Hour"],
          gopass: ["go-pass","GO Pass"], season: ["season","Season"], gbl: ["gbl","GO Battle League"],
          city_safari: ["city","City Safari"], community_day: ["community","Community Day"], theme: ["theme","Theme Event A"]
        };
        mapped = m[e.categoryKey];
      }
      const laneSub = Core.canonicalizeLaneSub((e.lane && e.sub) ? {lane:e.lane, sub:e.sub, overlay:e.overlay, overlayTargetSub:e.overlayTargetSub} : (mapped ? {lane:mapped[0], sub:mapped[1]} : Core.chooseLaneAndSub(out)));
      out.lane = laneSub.lane;
      out.sub = laneSub.sub;
      out.overlay = laneSub.overlay || e.overlay || null;
      out.overlayTargetSub = laneSub.overlayTargetSub || e.overlayTargetSub || null;
      if (e.shortTitle) out.shortTitle = Core.cleanTitle(e.shortTitle);
      else if (out.lane === "weekly") out.shortTitle = Core.shortenWeekly(out.title);
      else if (out.lane === "raids") out.shortTitle = Core.shortenRaids(out.title);
      else if (out.lane === "gbl") out.shortTitle = Core.shortenGBL(out.title);
      else out.shortTitle = Core.cleanTitle(out.title);
      out.id = Core.makeEventId(out) || e.id;
      return out;
    }catch(err){
      console.warn("LDT: failed to normalize cached event", err, e);
      return null;
    }
  };

  Core.serializeEvent = function(e){
    const n = Core.normalizeLegacyEvent(e);
    if (!n) return null;
    return {
      id: n.id,
      title: n.title || "",
      shortTitle: n.shortTitle || "",
      category: n.category || "",
      lane: n.lane || "",
      sub: n.sub || "",
      overlay: n.overlay || null,
      overlayTargetSub: n.overlayTargetSub || null,
      rawText: n.rawText || "",
      href: Core.normalizeHref(n.href || ""),
      start: Core.toISODate(n.start),
      endKnown: Core.toISODate(n.endKnown),
      endInferred: Core.toISODate(n.endInferred),
      isLocal: n.isLocal !== false,
      firstSeenAt: n.firstSeenAt || null,
      lastSeenAt: n.lastSeenAt || null,
      status: n.status || "saved"
    };
  };

  Core._mergeEventRecord = function(prev, next){
    if (!prev) return next;
    if (!next) return prev;
    const out = {...prev};
    for (const k of ["title","shortTitle","category","lane","sub","overlay","overlayTargetSub","rawText","href","status"]){
      if (next[k] != null && next[k] !== "") out[k] = next[k];
    }
    for (const k of ["start","endKnown","endInferred"]){
      if (next[k]) out[k] = next[k];
    }
    out.isLocal = next.isLocal !== false;
    out.firstSeenAt = prev.firstSeenAt || next.firstSeenAt || null;
    out.lastSeenAt = next.lastSeenAt || prev.lastSeenAt || null;
    out.id = Core.makeEventId(out) || next.id || prev.id;
    return out;
  };

  Core.dedupeEvents = function(events){
    const map = Object.create(null);
    for (const raw of (events || [])){
      const n = Core.normalizeLegacyEvent(raw);
      if (!n || (!n.title && !n.href)) continue;
      const id = n.id || Core.makeEventId(n);
      n.id = id;
      map[id] = Core._mergeEventRecord(map[id], n);
    }
    const laneRank = Object.create(null);
    Core.LANES_SPEC.forEach((lane, laneIndex)=>{
      (lane.sub || [lane.key]).forEach((sub, subIndex)=>{ laneRank[`${lane.key}::${sub}`] = laneIndex * 100 + subIndex; });
    });
    return Object.values(map).sort((a,b)=>{
      const ra = laneRank[`${a.lane}::${a.sub}`] ?? 9999;
      const rb = laneRank[`${b.lane}::${b.sub}`] ?? 9999;
      const ta = a.start ? +new Date(a.start) : 0;
      const tb = b.start ? +new Date(b.start) : 0;
      return (ra - rb) || (ta - tb) || String(a.title||"").localeCompare(String(b.title||""));
    });
  };

  Core.eventsMapFromList = function(events){
    const out = Object.create(null);
    for (const e of Core.dedupeEvents(events)){
      const ser = Core.serializeEvent(e);
      if (ser) out[ser.id] = ser;
    }
    return out;
  };

  Core.fingerprintEvents = function(events){
    return Core.dedupeEvents(events).map(e => {
      const s = Core.serializeEvent(e) || {};
      return [s.id,s.title,s.category,s.lane,s.sub,s.href,s.start,s.endKnown,s.endInferred].join("|");
    }).sort().join("\n");
  };

  Core.objectFingerprint = function(obj){
    const stable = (v) => {
      if (v == null || typeof v !== "object") return v;
      if (Array.isArray(v)) return v.map(stable);
      const out = {};
      Object.keys(v).sort().forEach(k => { out[k] = stable(v[k]); });
      return out;
    };
    try { return JSON.stringify(stable(obj || {})); }
    catch(_) { return String(Date.now()); }
  };

  Core._eventListFromCache = function(cache){
    if (!cache) return [];
    if (Array.isArray(cache)) return cache;
    if (typeof cache === "object") return Object.values(cache);
    return [];
  };

  Core._prepareStateForStorage = function(partial){
    const safe = {...(partial || {})};
    for (const key of ["ldt_events"]){
      if (Array.isArray(safe[key])) safe[key] = safe[key].map(Core.serializeEvent).filter(Boolean);
    }
    for (const key of ["ld_events_cache", "ld_events_history_cache"]){
      if (safe[key]) safe[key] = Core.eventsMapFromList(Core._eventListFromCache(safe[key]));
    }
    return safe;
  };

  Core.loadState = () => new Promise(res => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local){
      res({ lang:Core.DEFAULT_LANG, colors:{...Core.DEFAULT_COLORS}, events:[], eventsCsv:"", eventsCache:{}, detailsCache:{}, dict:{}, namesCsv:"", eventsFingerprint:"", settings:Core.normalizeSettings({}), remoteUrl:Core.DEFAULT_REMOTE_URL, remoteEnabled:true, displayTimeZone:"local" });
      return;
    }
    const keys = [
      "ld_lang","ld_colors","ld_events_csv_text","ld_events_history_csv_text","ld_events_cache","ld_events_history_cache","ld_details_cache","ld_dict_custom","ld_names_csv_text",
      "ldt_lang","ldt_palette","ldt_events","ldt_saved_at","ld_events_fingerprint","ld_events_live_ids","ld_last_scan_at",
      "ld_settings","ld_display_timezone","ld_remote_url","ld_remote_enabled","ld_remote_events_csv_text","ld_remote_last_fetch_at","ld_remote_last_error"
    ];
    try{
      chrome.storage.local.get(keys, (data)=>{
        try{
          if (chrome.runtime && chrome.runtime.lastError) console.warn("LDT storage get:", chrome.runtime.lastError.message);
          const candidates = [];
          candidates.push(...Core._eventListFromCache(data.ldt_events));
          if (data.ld_events_csv_text) candidates.push(...Core.csvToEvents(data.ld_events_csv_text));
          if (data.ld_events_history_csv_text) candidates.push(...Core.csvToEvents(data.ld_events_history_csv_text));
          candidates.push(...Core._eventListFromCache(data.ld_events_cache));
          candidates.push(...Core._eventListFromCache(data.ld_events_history_cache));
          // Remote data is appended last so it wins over stale local scans/caches.
          if (data.ld_remote_events_csv_text) candidates.push(...Core.csvToEvents(data.ld_remote_events_csv_text));
          const events = Core.dedupeEvents(candidates);
          const eventsCsv = events.length ? Core.eventsToCSV(events) : (data.ld_events_history_csv_text || data.ld_events_csv_text || "");
          res({
            lang:data.ld_lang||data.ldt_lang||Core.DEFAULT_LANG,
            colors:{...Core.DEFAULT_COLORS, ...(data.ldt_palette||{}), ...(data.ld_colors||{})},
            events,
            eventsCsv,
            eventsCache:Core.eventsMapFromList(events),
            detailsCache:data.ld_details_cache||{},
            dict:data.ld_dict_custom||{},
            namesCsv: data.ld_names_csv_text||"",
            eventsFingerprint:data.ld_events_fingerprint||"",
            liveIds:Array.isArray(data.ld_events_live_ids) ? data.ld_events_live_ids : [],
            lastScanAt:data.ld_last_scan_at||data.ldt_saved_at||0,
            settings:Core.normalizeSettings(data.ld_settings),
            displayTimeZone:data.ld_display_timezone || "local",
            remoteUrl:Core.normalizeRemoteUrl(data.ld_remote_url),
            remoteEnabled:data.ld_remote_enabled !== false,
            remoteLastFetchAt:data.ld_remote_last_fetch_at || 0,
            remoteLastError:data.ld_remote_last_error || ""
          });
        }catch(err){
          console.error("LDT: loadState normalization failed; falling back to empty state", err);
          res({ lang:Core.DEFAULT_LANG, colors:{...Core.DEFAULT_COLORS}, events:[], eventsCsv:"", eventsCache:{}, detailsCache:{}, dict:{}, namesCsv:"", eventsFingerprint:"", settings:Core.normalizeSettings({}), remoteUrl:Core.DEFAULT_REMOTE_URL, remoteEnabled:true, displayTimeZone:"local" });
        }
      });
    }catch(err){
      console.error("LDT: storage unavailable", err);
      res({ lang:Core.DEFAULT_LANG, colors:{...Core.DEFAULT_COLORS}, events:[], eventsCsv:"", eventsCache:{}, detailsCache:{}, dict:{}, namesCsv:"", eventsFingerprint:"", settings:Core.normalizeSettings({}), remoteUrl:Core.DEFAULT_REMOTE_URL, remoteEnabled:true, displayTimeZone:"local" });
    }
  });

  Core.saveState = (partial) => new Promise(res => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local){ res(false); return; }
    const safe = Core._prepareStateForStorage(partial || {});
    try{
      chrome.storage.local.set(safe, ()=>{
        if (chrome.runtime && chrome.runtime.lastError){ console.warn("LDT storage set:", chrome.runtime.lastError.message); res(false); }
        else res(true);
      });
    }catch(err){ console.warn("LDT: saveState failed", err); res(false); }
  });

  Core.saveEventsToHistory = async function(liveEvents, opts={}){
    const now = Date.now();
    const st = await Core.loadState();
    const live = Core.dedupeEvents(liveEvents || []).map(e => ({...e, status:"active", firstSeenAt:e.firstSeenAt || now, lastSeenAt:now}));
    const historical = Core.dedupeEvents(st.events || []);
    const merged = Core.dedupeEvents(historical.concat(live));
    const liveIds = live.map(e=>e.id).sort();
    const detailsCache = opts.detailsCache || st.detailsCache || {};
    const fingerprint = Core._stringHash(Core.fingerprintEvents(merged) + "\nlive:" + liveIds.join(",") + "\ndetails:" + Core.objectFingerprint(detailsCache));
    if (!opts.force && fingerprint === st.eventsFingerprint){
      return {changed:false, events:merged, csv:Core.eventsToCSV(merged), liveIds};
    }
    const csv = Core.eventsToCSV(merged);
    const map = Core.eventsMapFromList(merged);
    const ok = await Core.saveState({
      ld_history_version: Core.STORAGE_SCHEMA_VERSION,
      ld_events_history_cache: map,
      ld_events_cache: map,
      ld_events_history_csv_text: csv,
      ld_events_csv_text: csv,
      ld_events_live_ids: liveIds,
      ld_details_cache: detailsCache,
      ld_events_fingerprint: fingerprint,
      ldt_saved_at: now,
      ld_last_scan_at: now
    });
    if (!ok){
      await Core.saveState({
        ld_history_version: Core.STORAGE_SCHEMA_VERSION,
        ld_events_history_csv_text: csv,
        ld_events_csv_text: csv,
        ld_events_live_ids: liveIds,
        ld_events_fingerprint: fingerprint,
        ldt_saved_at: now,
        ld_last_scan_at: now
      });
    }
    return {changed:ok, events:merged, csv, liveIds};
  };

  Core.rehydrateEvent = function(e){
    function toDate(x){ if(!x) return null; const d=new Date(x); return isNaN(+d) ? null : d; }
    if (typeof e.start === "string") e.start = toDate(e.start);
    if (typeof e.endKnown === "string") e.endKnown = toDate(e.endKnown);
    if (typeof e.endInferred === "string") e.endInferred = toDate(e.endInferred);
    return e;
  };

  Core.detailParse = function(html){
    try{
      const doc = new DOMParser().parseFromString(html, "text/html");
      function pick(id){
        const sec = doc.querySelector(`#${id}`);
        if(!sec) return null;
        const dateSpan = sec.querySelector('span[data-event-page-date], span[data-event-page-data]');
        const timeSpan = sec.querySelector('span[data-event-page-time]');
        const dateTxt = dateSpan ? (dateSpan.getAttribute('data-event-page-date') || dateSpan.getAttribute('data-event-page-data') || dateSpan.textContent.trim()) : "";
        const timeTxt = timeSpan ? (timeSpan.getAttribute('data-event-page-time') || timeSpan.textContent.trim()) : "";
        return (dateTxt||timeTxt) ? (dateTxt + " " + timeTxt) : null;
      }
      const startStr = pick("start-text");
      const endStr   = pick("end-text");
      const start = Core.parseLocalDateString(startStr);
      const end   = Core.parseLocalDateString(endStr);
      return { start, end };
    }catch(err){ return { start:null, end:null }; }
  };

  Core.inferEnd = function(e, allEvents){
    const titleLower=(e.title||"").toLowerCase();
    if (!e.start) return { known: null, inferred: null };
    const sub = e.sub || "";
    if (sub === "Raid Hour" || sub === "Pokémon Spotlight Hour") return { known:null, inferred: Core.addHours(e.start, 1) };
    if (sub === "Max Mondays") return { known:null, inferred: Core.addHours(e.start, 15) }; // LeekDuck details: Mondays 6 AM → 9 PM local time.
    if (/weekend/.test(titleLower)){
      const start = new Date(e.start);
      const dow=start.getDay();
      const saturday=new Date(start);
      saturday.setDate(start.getDate()+((6-dow+7)%7));
      saturday.setHours(0,0,0,0);
      const sundayEnd = new Date(saturday); sundayEnd.setDate(saturday.getDate()+1); sundayEnd.setHours(23,0,0,0);
      return { known: null, inferred: sundayEnd };
    }
    if (/\bday\b/.test(titleLower)){ return { known: null, inferred: Core.addDays(e.start, 1) }; }
    const sameTypePrev = allEvents.filter(x => x.id !== e.id).filter(x => x.sub === e.sub).filter(x => x.endKnown).map(x => (x.endKnown - x.start)).filter(ms => ms > 0);
    let avgMs = null; if (sameTypePrev.length > 0){ avgMs = sameTypePrev.reduce((a,b)=>a+b,0)/sameTypePrev.length; }
    let inferred = avgMs ? new Date(e.start.getTime() + avgMs) : Core.addDays(e.start, 1);
    const nextSameType = allEvents.filter(x => x.id !== e.id).filter(x => x.sub === e.sub && x.start && x.start > e.start).sort((a,b)=>a.start-b.start)[0];
    if (nextSameType){
      const cap = new Date(nextSameType.start);
      cap.setDate(cap.getDate()-1); cap.setHours(22,0,0,0);
      if (inferred > cap) inferred = cap;
    }
    return { known: null, inferred };
  };


  /* v1.1 shared display-timezone, CSV, and info-page helpers */
  Core.DISPLAY_TIME_ZONES = [
    {id:"local", label:"Local / 浏览器"},
    {id:"UTC", label:"UTC"},
    {id:"America/Los_Angeles", label:"PT / Los Angeles"},
    {id:"Asia/Tokyo", label:"JST / Tokyo"},
    {id:"Asia/Shanghai", label:"CST / Shanghai"},
    {id:"Europe/Copenhagen", label:"CET/CEST / Copenhagen"},
    {id:"Europe/London", label:"GMT/BST / London"}
  ];

  Core._parseBoolish = function(value, fallback){
    if (value == null || value === "") return fallback;
    const s = String(value).trim().toLowerCase();
    if (["false","0","no","fixed","absolute"].includes(s)) return false;
    if (["true","1","yes","local","floating"].includes(s)) return true;
    return fallback;
  };

  Core.isFixedTimeEvent = function(e){
    if (!e) return false;
    if (e.isLocal === false) return true;
    if (typeof e.isLocal === "string" && Core._parseBoolish(e.isLocal, true) === false) return true;
    const tz = String(e.timeZone || e.fixedTimeZone || "").trim();
    if (tz && !/local/i.test(tz)) return true;
    if ((e.sub || "") === "GO Battle League" && /(?:Z|[+\-]\d{2}:?\d{2})$/i.test(String(e.start || ""))) return true;
    return false;
  };

  Core._dateInDisplayZone = function(date, timeZone){
    if (!(date instanceof Date) || isNaN(+date)) return null;
    if (!timeZone || timeZone === "local") return new Date(+date);
    try{
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone, year:"numeric", month:"2-digit", day:"2-digit",
        hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
      }).formatToParts(date).reduce((acc,p)=>{ if(p.type !== "literal") acc[p.type] = p.value; return acc; }, {});
      return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second, 0);
    }catch(_){
      return new Date(+date);
    }
  };

  Core.eventDisplayDate = function(e, field, displayTimeZone){
    if (!e) return null;
    const value = e[field] || (field === "end" ? (e.endKnown || e.endInferred) : null);
    const d = Core.parseLocalDateString(value);
    if (!d) return null;
    return Core.isFixedTimeEvent(e) ? Core._dateInDisplayZone(d, displayTimeZone || "local") : d;
  };
  Core.eventStartMs = function(e, displayTimeZone){ const d = Core.eventDisplayDate(e, "start", displayTimeZone); return d ? +d : NaN; };
  Core.eventEndMs = function(e, displayTimeZone){ const d = Core.eventDisplayDate(e, "endKnown", displayTimeZone) || Core.eventDisplayDate(e, "endInferred", displayTimeZone); return d ? +d : NaN; };
  Core.formatEventRange = function(e, displayTimeZone){
    const a = Core.eventDisplayDate(e, "start", displayTimeZone);
    const b = Core.eventDisplayDate(e, "endKnown", displayTimeZone) || Core.eventDisplayDate(e, "endInferred", displayTimeZone);
    const suffix = Core.isFixedTimeEvent(e) ? ` [${displayTimeZone && displayTimeZone !== "local" ? displayTimeZone : (e.timeZone || "fixed")}]` : " [Local]";
    return `${Core.fmt(a)} → ${Core.fmt(b)}${suffix}`;
  };

  Core.eventsToCSV = function(events){
    const header = ["title","shortTitle","category","lane","sub","start","endKnown","endInferred","isLocal","timeZone","href"].join(",");
    const rows = Core.dedupeEvents(events || []).map(e => [
      JSON.stringify(e.title||""), JSON.stringify(e.shortTitle||""), JSON.stringify(e.category||""),
      JSON.stringify(e.lane||""), JSON.stringify(e.sub||""),
      JSON.stringify(e.start? Core.toISODate(e.start):""),
      JSON.stringify(e.endKnown? Core.toISODate(e.endKnown):""),
      JSON.stringify(e.endInferred? Core.toISODate(e.endInferred):""),
      JSON.stringify(Core.isFixedTimeEvent(e) ? "false" : "true"),
      JSON.stringify(e.timeZone || (Core.isFixedTimeEvent(e) ? "fixed" : "Local Time")),
      JSON.stringify(e.href||"")
    ].join(","));
    return [header].concat(rows).join("\n");
  };

  Core.csvToEvents = function(text){
    if (!text) return [];
    const lines = String(text).split(/\r?\n/).filter(x=>x.trim().length>0);
    if (lines.length<=1) return [];
    const header = Core._splitCsvLine(lines[0]).map(h => String(h).replace(/(^"|"$)/g,""));
    const idx = {}; header.forEach((h,i)=> idx[h] = i);
    const required = ["title","shortTitle","category","lane","sub","start","endKnown","endInferred","href"];
    if (!required.every(k => Object.prototype.hasOwnProperty.call(idx,k))){
      console.warn("LDT: CSV header not recognized; ignoring imported cache.");
      return [];
    }
    const getRaw = (cols,key)=> Object.prototype.hasOwnProperty.call(idx,key) ? cols[idx[key]] : "";
    const getVal = (cols,key,fallback="")=> Core._safeJsonField(getRaw(cols,key), fallback);
    const parseDateField = (cols,key)=> Core.parseLocalDateString(getVal(cols,key,""));
    const fixedByRaw = (cols)=>{
      const raw = [getVal(cols,"start",""), getVal(cols,"endKnown",""), getVal(cols,"endInferred","")].join(" ");
      return /(?:Z|[+\-]\d{2}:?\d{2})\s*$/i.test(raw);
    };
    const events=[];
    for (let i=1;i<lines.length;i++){
      try{
        const cols = Core._splitCsvLine(lines[i]);
        const isLocalRaw = getVal(cols,"isLocal","");
        const tz = getVal(cols,"timeZone","");
        const isLocal = Core._parseBoolish(isLocalRaw, !(tz && !/local/i.test(tz)) && !fixedByRaw(cols));
        const e = {
          title: getVal(cols,"title",""),
          shortTitle: getVal(cols,"shortTitle",""),
          category: getVal(cols,"category",""),
          lane: getVal(cols,"lane",""),
          sub: getVal(cols,"sub",""),
          start: parseDateField(cols,"start"),
          endKnown: parseDateField(cols,"endKnown"),
          endInferred: parseDateField(cols,"endInferred"),
          href: getVal(cols,"href",""),
          isLocal,
          timeZone: tz || (isLocal ? "Local Time" : "fixed")
        };
        if (!e.title && !e.href) continue;
        const normalized = Core.normalizeLegacyEvent(e);
        if (normalized) events.push(normalized);
      }catch(err){
        console.warn("LDT: skipped bad CSV row", i+1, err);
      }
    }
    return events;
  };

  const _ndNormalizeLegacyEvent = Core.normalizeLegacyEvent;
  Core.normalizeLegacyEvent = function(e){
    const out = _ndNormalizeLegacyEvent(e);
    if (!out) return null;
    const fixedHint = e && (e.isLocal === false || Core._parseBoolish(e.isLocal, true) === false);
    out.isLocal = fixedHint ? false : (e && e.isLocal !== false);
    out.timeZone = (e && (e.timeZone || e.fixedTimeZone)) || (out.isLocal === false ? "fixed" : "Local Time");
    return out;
  };

  Core.serializeEvent = function(e){
    const n = Core.normalizeLegacyEvent(e);
    if (!n) return null;
    return {
      id: n.id,
      title: n.title || "",
      shortTitle: n.shortTitle || "",
      category: n.category || "",
      lane: n.lane || "",
      sub: n.sub || "",
      overlay: n.overlay || null,
      overlayTargetSub: n.overlayTargetSub || null,
      rawText: n.rawText || "",
      href: Core.normalizeHref(n.href || ""),
      start: Core.toISODate(n.start),
      endKnown: Core.toISODate(n.endKnown),
      endInferred: Core.toISODate(n.endInferred),
      isLocal: n.isLocal !== false,
      timeZone: n.timeZone || (n.isLocal === false ? "fixed" : "Local Time"),
      firstSeenAt: n.firstSeenAt || null,
      lastSeenAt: n.lastSeenAt || null,
      status: n.status || "saved"
    };
  };

  Core._mergeEventRecord = function(prev, next){
    if (!prev) return next;
    if (!next) return prev;
    const out = {...prev};
    for (const k of ["title","shortTitle","category","lane","sub","overlay","overlayTargetSub","rawText","href","status","timeZone"]){
      if (next[k] != null && next[k] !== "") out[k] = next[k];
    }
    for (const k of ["start","endKnown","endInferred"]){
      if (next[k]) out[k] = next[k];
    }
    out.isLocal = (prev.isLocal === false || next.isLocal === false) ? false : true;
    out.firstSeenAt = prev.firstSeenAt || next.firstSeenAt || null;
    out.lastSeenAt = next.lastSeenAt || prev.lastSeenAt || null;
    out.id = Core.makeEventId(out) || next.id || prev.id;
    return out;
  };

  Core.parseTableCSV = function(text){
    const lines = String(text || "").split(/\r?\n/).filter(x=>x.trim().length);
    if (!lines.length) return [];
    const header = Core._splitCsvLine(lines[0]).map(x=>String(x).replace(/^"|"$/g,""));
    return lines.slice(1).map(line=>{
      const cols = Core._splitCsvLine(line).map(x=>{
        try { return JSON.parse(x); } catch(_){ return String(x).replace(/^"|"$/g,"").replace(/""/g,'"'); }
      });
      const row = {};
      header.forEach((h,i)=> row[h] = cols[i] == null ? "" : cols[i]);
      return row;
    });
  };

  Core.initInfoPages = function(opts){
    opts = opts || {};
    const state = opts.state || {};
    const updateViewMode = opts.updateViewMode || function(){};
    const getDataUrl = opts.getDataUrl || (path => (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL(path) : path));
    const wrap = document.getElementById("ld-timeline-wrapper");
    if (!wrap || wrap.__ndInfoInit) return;
    wrap.__ndInfoInit = true;
    let panel = document.getElementById("nd-info-panel");
    if (!panel){
      panel = document.createElement("div");
      panel.id = "nd-info-panel";
      wrap.appendChild(panel);
    }
    const cache = {};
    async function fetchRows(path){
      if (cache[path]) return cache[path];
      const res = await fetch(getDataUrl(path), {cache:"no-store"});
      const txt = await res.text();
      cache[path] = Core.parseTableCSV(txt);
      return cache[path];
    }
    const labelType = (en)=> {
      const row = (cache["data/type_names.csv"] || []).find(r=>r.type_en===en);
      if (!row) return en;
      return state.lang === "en" ? en : (state.lang === "zh-TW" ? row.zh_tw : row.zh_cn);
    };
    function setActive(tab){
      wrap.querySelectorAll("[data-nd-tab]").forEach(b=>b.classList.toggle("active", b.getAttribute("data-nd-tab")===tab));
      const infoMode = tab !== "timeline";
      wrap.classList.toggle("nd-info-mode", infoMode);
      panel.style.display = infoMode ? "block" : "none";
      const left = document.getElementById("ld-left"), right = document.getElementById("ld-right");
      if (left) left.style.display = infoMode ? "none" : "";
      if (right) right.style.display = infoMode ? "none" : "";
      if (!infoMode) { updateViewMode(); return; }
      if (tab === "types") renderTypes();
      if (tab === "pokedex") renderPokedex();
      if (tab === "max") renderMax();
    }
    wrap.querySelectorAll("[data-nd-tab]").forEach(btn=>{
      if (btn.__ndTabBound) return;
      btn.__ndTabBound = true;
      btn.addEventListener("click", ()=>setActive(btn.getAttribute("data-nd-tab")));
    });

    async function renderTypes(){
      panel.innerHTML = `<div class="nd-loading">Loading...</div>`;
      const [chart, names] = await Promise.all([fetchRows("data/type_chart.csv"), fetchRows("data/type_names.csv")]);
      cache["data/type_names.csv"] = names;
      const typeIds = names.map(r=>r.type_en);
      let selectedAtk = [];
      let selectedDef = [];
      function mult(attack, defenders){
        const row = chart.find(r=>r.attack_en===attack);
        if (!row) return 1;
        return defenders.reduce((acc,d)=>acc*Number(row[d] || 1), 1);
      }
      function pushSel(arr, v){
        const idx = arr.indexOf(v);
        if (idx >= 0) arr.splice(idx,1);
        else { arr.push(v); while(arr.length > 2) arr.shift(); }
      }
      function draw(){
        const head = typeIds.map(t=>`<th class="nd-type-col ${selectedDef.includes(t)?"sel":""}" data-def="${Core.escapeHTML(t)}">${Core.escapeHTML(labelType(t))}</th>`).join("");
        const body = chart.map(row=>{
          const cells = typeIds.map(t=>{
            const v = Number(row[t] || 1);
            const cls = v>1 ? "good" : (v<1 ? "bad" : "neutral");
            return `<td class="${cls} ${selectedDef.includes(t)?"sel":""}">${v.toFixed(3)}</td>`;
          }).join("");
          return `<tr><th class="nd-type-row ${selectedAtk.includes(row.attack_en)?"sel":""}" data-atk="${Core.escapeHTML(row.attack_en)}">${Core.escapeHTML(labelType(row.attack_en))}</th>${cells}</tr>`;
        }).join("");
        const atkLabel = selectedAtk.map(labelType).join(" / ") || "∅";
        const defLabel = selectedDef.map(labelType).join(" / ") || "∅";
        const combos = [];
        for (let i=0;i<typeIds.length;i++){
          combos.push([typeIds[i]]);
          for (let j=i+1;j<typeIds.length;j++) combos.push([typeIds[i], typeIds[j]]);
        }
        let attackSummary = "";
        const attacks = selectedAtk.length ? selectedAtk : [];
        for (const a of attacks){
          const scored = combos.map(ds=>({ds, m:mult(a, ds)})).sort((x,y)=>y.m-x.m);
          const max = scored[0] ? scored[0].m : 1;
          const best = scored.filter(x=>Math.abs(x.m-max)<1e-9).slice(0,16).map(x=>`${x.ds.map(labelType).join("/")}: ${x.m.toFixed(3)}`).join("<br>");
          const chosen = selectedDef.length ? `<div class="nd-result-line"><b>${Core.escapeHTML(labelType(a))} → ${Core.escapeHTML(defLabel)}</b>: ${mult(a, selectedDef).toFixed(3)}</div>` : "";
          attackSummary += `<section><h4>${Core.escapeHTML(labelType(a))}</h4>${chosen}<div class="nd-small">${Core.escapeHTML(Core.t(state.lang,"strongestInto"))}</div><div>${best}</div></section>`;
        }
        let defenseSummary = "";
        if (selectedDef.length){
          const rows = typeIds.map(a=>({a, m:mult(a, selectedDef)})).sort((x,y)=>y.m-x.m || labelType(x.a).localeCompare(labelType(y.a)));
          defenseSummary = `<section><h4>${Core.escapeHTML(Core.t(state.lang,"weakestTo"))}: ${Core.escapeHTML(defLabel)}</h4>` +
            rows.map(x=>`<div class="nd-result-line ${x.m>1?"good":(x.m<1?"bad":"")}">${Core.escapeHTML(labelType(x.a))}: ${x.m.toFixed(3)}</div>`).join("") + `</section>`;
        }
        panel.innerHTML = `<div class="nd-info-layout nd-types-layout">
          <div>
            <p class="nd-hint">${Core.escapeHTML(Core.t(state.lang,"typeHint"))}</p>
            <div class="nd-table-scroll"><table class="nd-type-table"><thead><tr><th>攻\\防</th>${head}</tr></thead><tbody>${body}</tbody></table></div>
          </div>
          <aside class="nd-side-card">
            <h3>${Core.escapeHTML(Core.t(state.lang,"selected"))}</h3>
            <div>${Core.escapeHTML(Core.t(state.lang,"attackView"))}: <b>${Core.escapeHTML(atkLabel)}</b></div>
            <div>${Core.escapeHTML(Core.t(state.lang,"defenseView"))}: <b>${Core.escapeHTML(defLabel)}</b></div>
            ${attackSummary || `<p class="nd-muted">请选择一个攻击属性。</p>`}
            ${defenseSummary}
          </aside>
        </div>`;
        panel.querySelectorAll("[data-atk]").forEach(el=>el.addEventListener("click",()=>{ pushSel(selectedAtk, el.getAttribute("data-atk")); draw(); }));
        panel.querySelectorAll("[data-def]").forEach(el=>el.addEventListener("click",()=>{ pushSel(selectedDef, el.getAttribute("data-def")); draw(); }));
      }
      draw();
    }

    function tableFromRows(rows, columns, opts){
      opts = opts || {};
      const head = columns.map(c=>`<th>${Core.escapeHTML(c.label)}</th>`).join("");
      const body = rows.map(r=>{
        const cells = columns.map(c=>{
          const v = r[c.key] == null ? "" : String(r[c.key]);
          return `<td class="${v.trim()? "" : "nd-empty"}">${Core.escapeHTML(v)}</td>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<div class="nd-table-scroll"><table class="nd-data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    }

    async function renderPokedex(){
      panel.innerHTML = `<div class="nd-loading">Loading...</div>`;
      const rows = await fetchRows("data/pokedex.csv");
      const columns = [
        {key:"Number",label:"#"}, {key:"Name",label:"English"}, {key:"简中",label:"简中"}, {key:"繁中",label:"繁中"}, {key:"日文",label:"日本語"},
        {key:"Form",label:"Form"}, {key:"Type 1",label:"Type 1"}, {key:"Type 2",label:"Type 2"},
        {key:"HP",label:"HP"}, {key:"Attack",label:"Atk"}, {key:"Defense",label:"Def"}, {key:"Sp.Attack",label:"SpA"}, {key:"Sp.Defense",label:"SpD"}, {key:"Speed",label:"Spe"}
      ];
      panel.innerHTML = `<div class="nd-info-header"><input id="nd-pokedex-search" class="nd-search" placeholder="${Core.escapeHTML(Core.t(state.lang,"search"))} / Search"></div><div id="nd-pokedex-table"></div>`;
      const box = panel.querySelector("#nd-pokedex-search"), target = panel.querySelector("#nd-pokedex-table");
      function draw(){
        const q = (box.value || "").trim().toLowerCase();
        const filtered = q ? rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q))) : rows;
        target.innerHTML = tableFromRows(filtered.slice(0, 500), columns) + `<div class="nd-muted">${filtered.length} rows${filtered.length>500 ? "，仅显示前 500 行" : ""}</div>`;
      }
      box.addEventListener("input", draw);
      draw();
    }

    async function renderMax(){
      panel.innerHTML = `<div class="nd-loading">Loading...</div>`;
      const rows = await fetchRows("data/max.csv");
      const columns = [
        {key:"Max_Form",label:"Max Form"}, {key:"名称",label:"名称"}, {key:"Name_EN",label:"English"},
        {key:"LV40 CP",label:"LV40 CP"}, {key:"LV50 CP",label:"LV50 CP"}, {key:"坦度",label:"坦度"},
        {key:"属性1",label:"属性1"}, {key:"属性2",label:"属性2"}, {key:"0.5s 小招",label:"0.5s 小招"}, {key:"攻击",label:"Attack"},
        {key:"极巨技能1",label:"Max Move 1"}, {key:"平1",label:"Avg 1"}, {key:"极巨技能2",label:"Max Move 2"}, {key:"平2",label:"Avg 2"},
        {key:"超极巨技能",label:"G-Max Move"}, {key:"平G",label:"Avg G"}, {key:"Source_Status",label:"Source"}
      ];
      panel.innerHTML = `<div class="nd-info-header"><input id="nd-max-search" class="nd-search" placeholder="${Core.escapeHTML(Core.t(state.lang,"search"))} / Search"></div><div id="nd-max-table"></div>`;
      const box = panel.querySelector("#nd-max-search"), target = panel.querySelector("#nd-max-table");
      function draw(){
        const q = (box.value || "").trim().toLowerCase();
        const filtered = q ? rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q))) : rows;
        target.innerHTML = tableFromRows(filtered, columns) + `<div class="nd-muted">${filtered.length} rows</div>`;
      }
      box.addEventListener("input", draw);
      draw();
    }
  };


  // Public hook so other scripts can use
  window.LDT_Core = Core;
})();
