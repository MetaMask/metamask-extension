if(chrome?.browserAction) {
  chrome.browserAction.setBadgeText({ text: '°' });
} else if(browser?.browserAction) {
  browser.browserAction.setBadgeText({ text: '°' });
}
