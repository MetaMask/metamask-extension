// cross-browser connection to extension i18n API
const log = require('loglevel')

const getMessage = (locale, key, substitutions) => {
  // check locale is loaded
  if (!locale) {
    // throw new Error('Translator - has not loaded a locale yet.')
    return ''
  }
  // check entry is present
  const { current, en } = locale
  const entry = current[key] || en[key]
  if (!entry) {
    log.error(`Translator - Unable to find value for "${key}"`)
    // throw new Error(`Translator - Unable to find value for "${key}"`)
  }
  let phrase = entry.message
  // perform substitutions
  if (substitutions && substitutions.length) {
    phrase = phrase.replace(/\$1/g, substitutions[0])
    if (substitutions.length > 1) {
      phrase = phrase.replace(/\$2/g, substitutions[1])
    }
  }
  return phrase
}

function fetchLocale (localeName) {
  return new Promise((resolve, reject) => {
    return fetch(`./_locales/${localeName}/messages.json`)
      .then(response => response.json())
      .then(
        locale => resolve(locale),
        error => {
          log.error(`failed to fetch ${localeName} locale because of ${error}`)
          resolve({})
        }
      )
  })
}

module.exports = {
  getMessage,
  fetchLocale,
}
