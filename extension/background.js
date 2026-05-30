const DEFAULT_REMOTE_URL = "https://raw.githubusercontent.com/Yang-Zhang-717/NeatDuck_Timeline/main/data/events.tsv";
const ALARM_NAME = "nd_remote_events_refresh";

function getLocal(keys){
  return new Promise(resolve => chrome.storage.local.get(keys, data => resolve(data || {})));
}
function setLocal(data){
  return new Promise(resolve => chrome.storage.local.set(data, () => resolve(!chrome.runtime.lastError)));
}
function validRemoteUrl(input){
  try{
    const raw = String(input || DEFAULT_REMOTE_URL).trim();
    const u = new URL(raw || DEFAULT_REMOTE_URL);
    if (u.protocol !== "https:") return DEFAULT_REMOTE_URL;
    if (u.hostname === "yang-zhang-717.github.io" && /\/NeatDuck_Timeline\/data\/events\.(?:csv|tsv)$/i.test(u.pathname)) return DEFAULT_REMOTE_URL;
    const allowed = ["raw.githubusercontent.com", "yang-zhang-717.github.io"];
    if (!allowed.includes(u.hostname)) return DEFAULT_REMOTE_URL;
    return u.toString();
  }catch(_){ return DEFAULT_REMOTE_URL; }
}
async function refreshRemoteEvents(){
  const st = await getLocal(["ld_remote_url", "ld_remote_enabled"]);
  if (st.ld_remote_enabled === false) return { ok:false, skipped:true };
  const url = validRemoteUrl(st.ld_remote_url || DEFAULT_REMOTE_URL);
  try{
    const resp = await fetch(url, { cache:"no-store", credentials:"omit" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (text.length > 2_000_000) throw new Error("remote data is too large");
    const firstLine = (text.split(/\r?\n/)[0] || "").toLowerCase();
    if (!firstLine.includes("title") || !firstLine.includes("start")) throw new Error("remote TSV header is not recognized");
    await setLocal({
      ld_remote_url: url,
      ld_remote_events_csv_text: text,
      ld_remote_last_fetch_at: Date.now(),
      ld_remote_last_error: ""
    });
    return { ok:true, url, bytes:text.length };
  }catch(err){
    await setLocal({ ld_remote_last_error: String(err && err.message ? err.message : err), ld_remote_last_fetch_at: Date.now() });
    return { ok:false, url, error:String(err && err.message ? err.message : err) };
  }
}
function ensureAlarm(){
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: 720 });
}
chrome.runtime.onInstalled.addListener(()=>{ ensureAlarm(); refreshRemoteEvents().catch(console.warn); });
chrome.runtime.onStartup.addListener(()=>{ ensureAlarm(); refreshRemoteEvents().catch(console.warn); });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm && alarm.name === ALARM_NAME) refreshRemoteEvents(); });
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "nd_refresh_remote_events") return false;
  refreshRemoteEvents().then(sendResponse);
  return true;
});
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL(`standalone.html?source=action&ts=${Date.now()}`) });
});
