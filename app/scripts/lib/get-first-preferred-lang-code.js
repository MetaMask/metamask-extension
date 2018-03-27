const fs = require('fs')
const path = require('path')
const extension = require('extensionizer')
const promisify = require('pify')

const existingLocaleCodes = fs.readdirSync(path.join(__dirname, '..', '..', '_locales'))

async function getFirstPreferredLangCode () {
  const userPreferredLocaleCodes = await promisify(
    extension.i18n.getAcceptLanguages,
    { errorFirst: false }
  )()
  const firstPreferredLangCode = userPreferredLocaleCodes.find(code => existingLocaleCodes.includes(code))
  return firstPreferredLangCode || 'en'
}

module.exports = getFirstPreferredLangCode
