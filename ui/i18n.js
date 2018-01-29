
// cross-browser connection to extension i18n API

const chrome = chrome || null
const browser = browser || null
let getMessage = null

if ((chrome && chrome.i18n && chrome.i18n.getMessage) ||
    (browser && browser.i18n && browser.i18n.getMessage)) {
  getMessage = (chrome || browser).i18n.getMessage
} else {
  // fallback function
  console.warn('browser.i18n API not available?')
  const msg = require('../app/_locales/en/messages.json')
  getMessage = function (key, substitutions) {
    if (!msg[key]) {
      console.error(key)
      throw new Error(key)
    }
    let phrase = msg[key].message
    if (substitutions && substitutions.length) {
      phrase = phrase.replace(/\$1/g, substitutions[0])
      if (substitutions.length > 1) {
        phrase = phrase.replace(/\$2/g, substitutions[1])
      }
    }
    return phrase
  }
}

module.exports = getMessage
