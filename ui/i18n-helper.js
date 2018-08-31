// cross-browser connection to extension i18n API
const log = require('loglevel')

/**
 * Returns a localized message for the given key
 * @param {object} locale The locale
 * @param {string} key The message key
 * @param {string[]} substitutions A list of message substitution replacements
 * @return {null|string} The localized message
 */
const getMessage = (locale, key, substitutions) => {
  if (!locale) {
    return null
  }
  if (!locale[key]) {
    log.error(`Translator - Unable to find value for key "${key}"`)
    return null
  }
  const entry = locale[key]
  let phrase = entry.message
  // perform substitutions
  if (substitutions && substitutions.length) {
    substitutions.forEach((substitution, index) => {
      const regex = new RegExp(`\\$${index + 1}`, 'g')
      phrase = phrase.replace(regex, substitution)
    })
  }
  return phrase
}

async function fetchLocale (localeName) {
  try {
    const response = await fetch(`./_locales/${localeName}/messages.json`)
    return await response.json()
  } catch (error) {
    log.error(`failed to fetch ${localeName} locale because of ${error}`)
    return {}
  }
}

module.exports = {
  getMessage,
  fetchLocale,
}
