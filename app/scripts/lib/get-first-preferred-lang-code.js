const extension = require('extensionizer')
const promisify = require('pify')
const allLocales = require('../../_locales/index.json')

const existingLocaleCodes = allLocales.map(locale => locale.code)

async function getFirstPreferredLangCode () {
  const userPreferredLocaleCodes = await promisify(
    extension.i18n.getAcceptLanguages,
    { errorFirst: false }
  )()
  const firstPreferredLangCode = userPreferredLocaleCodes.find(code => existingLocaleCodes.includes(code))
  return firstPreferredLangCode || 'en'
}

module.exports = getFirstPreferredLangCode
