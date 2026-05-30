const standalone = document.getElementById("openStandalone");
const leekduck = document.getElementById("openLeekduck");
standalone.addEventListener("click", () => chrome.tabs.create({ url: chrome.runtime.getURL(`standalone.html?source=popup&ts=${Date.now()}`) }));
leekduck.addEventListener("click", () => chrome.tabs.create({ url: "https://leekduck.com/events/" }));
