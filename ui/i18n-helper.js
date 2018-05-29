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
    // throw new Error(`Translator - Unable to find value for "${key}"`)
    log.error(`Translator - Unable to find value for "${key}"`)
    return `[${key}]`
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

async function fetchLocale (localeName) {
  try {
    const response = await fetch(`./_locales/${localeName}/messages.json`)
    const locale = await response.json()
    return locale
  } catch (error) {
    log.error(`failed to fetch ${localeName} locale because of ${error}`)
    return {}
  }
}

module.exports = {
  getMessage,
  fetchLocale,
}
