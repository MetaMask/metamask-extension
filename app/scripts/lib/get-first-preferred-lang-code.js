const extension = require('extensionizer')
const promisify = require('pify')
const allLocales = require('../../_locales/index.json')
const log = require('loglevel')

// as far as i can tell, this is truthy in the case of Brave browser
// where extension.i18n.getAcceptLanguages throws due to not being implemented
// Unchecked runtime.lastError while running i18n.getAcceptLanguages: Access to extension API denied.
// https://stackoverflow.com/questions/28431505/unchecked-runtime-lasterror-when-using-chrome-api
const isSupported = extension.i18n && extension.i18n.getAcceptLanguages

const getPreferredLocales = isSupported ? promisify(
  extension.i18n.getAcceptLanguages,
  { errorFirst: false }
) : async () => []

const existingLocaleCodes = allLocales.map(locale => locale.code.toLowerCase().replace('_', '-'))

/**
 * Returns a preferred language code, based on settings within the user's browser. If we have no translations for the
 * users preferred locales, 'en' is returned.
 *
 * @returns {Promise<string>} Promises a locale code, either one from the user's preferred list that we have a translation for, or 'en'
 *
 */
async function getFirstPreferredLangCode () {
  let userPreferredLocaleCodes = await getPreferredLocales()
  if(!userPreferredLocaleCodes){
    userPreferredLocaleCodes = []    
  }
  log.debug(`user preferredLocaleCodes: ${userPreferredLocaleCodes}`)
  const firstPreferredLangCode = userPreferredLocaleCodes
    .map(code => code.toLowerCase())
    .find(code => existingLocaleCodes.includes(code))
  return firstPreferredLangCode || 'en'
}

module.exports = getFirstPreferredLangCode
