import extension from 'extensionizer'
import allLocales from '../../_locales/index.json'

const getUILanguage = extension.i18n ? extension.i18n.getUILanguage() : ''

// mapping some browsers return hyphen instead underscore in locale codes (e.g. zh_TW -> zh-tw)
const existingLocaleCodes = {}
allLocales.forEach((locale) => {
  if (locale && locale.code) {
    existingLocaleCodes[locale.code.toLowerCase().replace('_', '-')] = locale.code
  }
})

/**
 * Returns a default language code, based on settings within the user's browser. If we have no translations for the
 * users preferred locales, 'en' is returned.
 *
 * @returns {string} - A locale code, either the user's default language that we have a translation for, or 'en'
 *
 */
function getDefaultLangCode () {
  const userUILanguage = getUILanguage

  const firstPreferredLangCode = userUILanguage.toLowerCase().replace('_', '-')

  return existingLocaleCodes[firstPreferredLangCode] || 'en'
}

export default getDefaultLangCode
