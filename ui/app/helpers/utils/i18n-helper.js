// cross-browser connection to extension i18n API
const log = require('loglevel')

const warned = {}
/**
 * Returns a localized message for the given key
 * @param {string} localeCode The code for the current locale
 * @param {object} localeMessages The map of messages for the current locale
 * @param {string} key The message key
 * @param {string[]} substitutions A list of message substitution replacements
 * @return {null|string} The localized message
 */
const getMessage = (localeCode, localeMessages, key, substitutions) => {
  if (!localeMessages) {
    return null
  }
  if (!localeMessages[key]) {
    if (!warned[localeCode] || !warned[localeCode][key]) {
      if (!warned[localeCode]) {
        warned[localeCode] = {}
      }
      warned[localeCode][key] = true
      log.warn(`Translator - Unable to find value of key "${key}" for locale "${localeCode}"`)
    }
    return null
  }
  const entry = localeMessages[key]
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

async function fetchLocale (localeCode) {
  try {
    const response = await fetch(`./_locales/${localeCode}/messages.json`)
    return await response.json()
  } catch (error) {
    log.error(`failed to fetch ${localeCode} locale because of ${error}`)
    return {}
  }
}

module.exports = {
  getMessage,
  fetchLocale,
}
