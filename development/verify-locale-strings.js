// //////////////////////////////////////////////////////////////////////////////
//
// Locale verification script
//
// usage:
//
//     node app/scripts/verify-locale-strings.js [<locale>] [--fix] [--quiet]
//
// This script will validate that locales have no unused messages. It will check
// the English locale against string literals found under `ui/`, and it will check
// other locales by comparing them to the English locale.
//
// A report will be printed to the console detailing any unused locales, and also
// any missing messages in the non-English locales.
//
// The if the optional '--fix' parameter is given, locales will be automatically
// updated to remove any unused messages.
//
// The optional '--quiet' parameter reduces the verbosity of the output, printing
// just a single summary of results for each locale verified
//
// //////////////////////////////////////////////////////////////////////////////

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const log = require('loglevel')
const matchAll = require('string.prototype.matchall').getPolyfill()
const localeIndex = require('../app/_locales/index.json')

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

log.setDefaultLevel('info')

let fix = false
let specifiedLocale
for (const arg of process.argv.slice(2)) {
  if (arg === '--fix') {
    fix = true
  } else if (arg === '--quiet') {
    log.setLevel('error')
  } else {
    specifiedLocale = arg
  }
}

main()
  .catch((error) => {
    log.error(error)
    process.exit(1)
  })

async function main () {
  if (specifiedLocale) {
    log.info(`Verifying selected locale "${specifiedLocale}":\n`)
    const locale = localeIndex.find((localeMeta) => localeMeta.code === specifiedLocale)
    const failed = locale.code === 'en' ?
      await verifyEnglishLocale() :
      await verifyLocale(locale)
    if (failed) {
      process.exit(1)
    }
  } else {
    log.info('Verifying all locales:\n')
    let failed = await verifyEnglishLocale(fix)
    const localeCodes = localeIndex
      .filter((localeMeta) => localeMeta.code !== 'en')
      .map((localeMeta) => localeMeta.code)

    for (const code of localeCodes) {
      log.info() // Separate each locale report by a newline when not in '--quiet' mode
      const localeFailed = await verifyLocale(code, fix)
      failed = failed || localeFailed
    }

    if (failed) {
      process.exit(1)
    }
  }
}

function getLocalePath (code) {
  return path.resolve(__dirname, '..', 'app', '_locales', code, 'messages.json')
}

async function getLocale (code) {
  try {
    const localeFilePath = getLocalePath(code)
    const fileContents = await readFile(localeFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error('Locale file not found')
    } else {
      log.error(`Error opening your locale ("${code}") file: `, e)
    }
    process.exit(1)
    return undefined
  }
}

async function writeLocale (code, locale) {
  try {
    const localeFilePath = getLocalePath(code)
    return writeFile(localeFilePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error('Locale file not found')
    } else {
      log.error(`Error writing your locale ("${code}") file: `, e)
    }
    process.exit(1)
    return undefined
  }
}

async function verifyLocale (code) {
  const englishLocale = await getLocale('en')
  const targetLocale = await getLocale(code)

  const extraItems = compareLocalesForMissingItems({ base: targetLocale, subject: englishLocale })
  const missingItems = compareLocalesForMissingItems({ base: englishLocale, subject: targetLocale })

  const englishEntryCount = Object.keys(englishLocale).length
  const coveragePercent = 100 * (englishEntryCount - missingItems.length) / englishEntryCount

  if (extraItems.length) {
    console.log(`**${code}**: ${extraItems.length} unused messages`)
    log.info('Extra items that should not be localized:')
    extraItems.forEach(function (key) {
      log.info(`  - [ ] ${key}`)
    })
  } else {
    log.info(`**${code}**: ${extraItems.length} unused messages`)
  }

  log.info(`${coveragePercent.toFixed(2)}% coverage`)
  if (missingItems.length) {
    log.info(`Missing items not present in localized file:`)
    missingItems.forEach(function (key) {
      log.info(`  - [ ] ${key}`)
    })
  }

  if (!extraItems.length && !missingItems.length) {
    log.info('Full coverage  : )')
  }

  if (extraItems.length > 0) {
    if (fix) {
      const newLocale = { ...targetLocale }
      for (const item of extraItems) {
        delete newLocale[item]
      }
      await writeLocale(code, newLocale)
    }
    return true
  }

  return false
}

async function verifyEnglishLocale () {
  const englishLocale = await getLocale('en')
  const uiJSFiles = await findJavascriptFiles(path.resolve(__dirname, '..', 'ui'))
  const sharedJSFiles = await findJavascriptFiles(path.resolve(__dirname, '..', 'shared'))

  const javascriptFiles = sharedJSFiles.concat(uiJSFiles)

  // match "t(`...`)" because constructing message keys from template strings
  // prevents this script from finding the messages, and then inappropriately
  // deletes them
  const templateStringRegex = /\bt\(`.*`\)/ug
  const templateUsage = []

  // match the keys from the locale file
  const keyRegex = /'(\w+)'|"(\w+)"/ug
  const usedMessages = new Set()
  for await (const fileContents of getFileContents(javascriptFiles)) {
    for (const match of matchAll.call(fileContents, keyRegex)) {
      usedMessages.add(match[1] || match[2])
    }

    const templateMatches = fileContents.match(templateStringRegex)
    if (templateMatches) {
      // concat doesn't work here for some reason
      templateMatches.forEach((match) => templateUsage.push(match))
    }
  }

  // never consider these messages as unused
  const messageExceptions = ['appName', 'appDescription']

  const englishMessages = Object.keys(englishLocale)
  const unusedMessages = englishMessages
    .filter((message) => !messageExceptions.includes(message) && !usedMessages.has(message))

  if (unusedMessages.length) {
    console.log(`**en**: ${unusedMessages.length} unused messages`)
    log.info(`Messages not present in UI:`)
    unusedMessages.forEach(function (key) {
      log.info(`  - [ ] ${key}`)
    })
  }

  if (templateUsage.length) {
    log.info(`Forbidden use of template strings in 't' function:`)
    templateUsage.forEach(function (occurrence) {
      log.info(` - ${occurrence}`)
    })
  }

  if (!unusedMessages.length && !templateUsage.length) {
    log.info('Full coverage  : )')
    return false // failed === false
  }

  if (unusedMessages.length > 0 && fix) {
    const newLocale = { ...englishLocale }
    for (const key of unusedMessages) {
      delete newLocale[key]
    }
    await writeLocale('en', newLocale)
  }

  return true // failed === true
}

async function findJavascriptFiles (rootDir) {
  const javascriptFiles = []
  const contents = await readdir(rootDir, { withFileTypes: true })
  for (const file of contents) {
    if (file.isDirectory()) {
      javascriptFiles.push(...(await findJavascriptFiles(path.join(rootDir, file.name))))
    } else if (file.isFile() && file.name.endsWith('.js')) {
      javascriptFiles.push(path.join(rootDir, file.name))
    }
  }
  return javascriptFiles
}

async function * getFileContents (filenames) {
  for (const filename of filenames) {
    yield readFile(filename, 'utf8')
  }
}

function compareLocalesForMissingItems ({ base, subject }) {
  return Object.keys(base).filter((key) => !subject[key])
}
