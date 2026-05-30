document.getElementById("open-standalone").addEventListener("click",()=>chrome.tabs.create({url:chrome.runtime.getURL("standalone.html?src=popup")}));
document.getElementById("open-leekduck").addEventListener("click",()=>chrome.tabs.create({url:"https://leekduck.com/events/"}));
