import extension from 'extensionizer'
import allLocales from '../../_locales/index.json'

const getUILanguage = extension.i18n ? extension.i18n.getUILanguage() : async () => ''

// mapping some browsers return hyphen instead underscore in locale codes (e.g. zh_TW -> zh-tw)
const existingLocaleCodes = {}
allLocales.forEach((locale) => {
  if (locale && locale.code) {
    existingLocaleCodes[locale.code.toLowerCase().replace('_', '-')] = locale.code
  }
})

/**
 * Returns a preferred language code, based on settings within the user's browser. If we have no translations for the
 * users preferred locales, 'en' is returned.
 *
 * @returns {Promise<string>} - Promises a locale code, either one from the user's preferred list that we have a translation for, or 'en'
 *
 */
async function getFirstPreferredLangCode () {
  let userUILanguage

  try {
    userUILanguage = await getUILanguage()

  } catch (e) {
    // Brave currently throws when calling getAcceptLanguages, so this handles that.
    userUILanguage = ''
  }

  // safeguard for Brave Browser until they implement chrome.i18n.getAcceptLanguages
  // https://github.com/MetaMask/metamask-extension/issues/4270
  if (!userUILanguage) {
    userUILanguage = ''
  }

  const firstPreferredLangCode = getUILanguage.toLowerCase().replace('_', '-')

  return existingLocaleCodes[firstPreferredLangCode] || 'en'
}

export default getFirstPreferredLangCode

