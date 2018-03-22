const fs = require('fs')
const path = require('path')
const promisify = require('pify')

async function getLocaleMessages () {
  const localeMessagesPath = path.join(process.cwd(), 'app', '_locales', 'en', 'messages.json')
  const enLocaleMessagesJSON = await promisify(fs.readFile)(localeMessagesPath)
  const enLocaleMessages = JSON.parse(enLocaleMessagesJSON)
  return enLocaleMessages
}

module.exports = getLocaleMessages
