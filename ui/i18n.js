
// cross-browser connection to extension i18n API

var getMessage;

if ((chrome && chrome.i18n && chrome.i18n.getMessage) ||
    (browser && browser.i18n && browser.i18n.getMessage)) {
  getMessage = (chrome || browser).i18n.getMessage;
} else {
  // fallback function
  console.warn('browser.i18n API not available?');
  let msg = require('../app/_locales/en/messages.json');
  getMessage = function(key) {
    return msg[key].message;
  };
}

module.exports = getMessage;
