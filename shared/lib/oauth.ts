import browser from 'webextension-polyfill';

export function getIdentityAPI(): typeof chrome.identity | typeof browser.identity {
  // if chrome.identity API is available, we will use it
  // note that, in firefox, chrome.identity is available
  // but only some of the methods are supported
  // learn more here {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/identity#browser_compatibility}
  if (
    chrome?.identity &&
    'getRedirectURL' in chrome.identity &&
    'launchWebAuthFlow' in chrome.identity
  ) {
    return chrome.identity;
  }

  // otherwise use browser.identity API
  return browser.identity;
}

export function getTabsAPI(): typeof chrome.tabs | typeof browser.tabs {
  if (chrome?.tabs && 'query' in chrome.tabs) {
    return chrome.tabs;
  }

  return browser.tabs;
}
