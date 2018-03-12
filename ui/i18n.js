
// cross-browser connection to extension i18n API

const chrome = chrome || null
const browser = browser || null
const extension = require('extensionizer')
var log = require('loglevel')
window.log = log
let getMessage

if (extension.i18n && extension.i18n.getMessage) {
  getMessage = extension.i18n.getMessage
} else {
  // fallback function
  log.warn('browser.i18n API not available, calling back to english.')
  const msg = require('../app/_locales/en/messages.json')
  getMessage = function (key, substitutions) {
    if (!msg[key]) {
      log.error(key)
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

window.h = getMessage
module.exports = getMessage
