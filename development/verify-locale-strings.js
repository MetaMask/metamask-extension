// //////////////////////////////////////////////////////////////////////////////
//
// Locale verification script
//
// usage:
//
//     node app/scripts/verify-locale-strings.js [<locale>] [--fix]
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
// //////////////////////////////////////////////////////////////////////////////

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const matchAll = require('string.prototype.matchall').getPolyfill()
const localeIndex = require('../app/_locales/index.json')
const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

console.log('Locale Verification')

let fix = false
let specifiedLocale
if (process.argv[2] === '--fix') {
  fix = true
  specifiedLocale = process.argv[3]
} else {
  specifiedLocale = process.argv[2]
  if (process.argv[3] === '--fix') {
    fix = true
  }
}

main(specifiedLocale, fix)
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

async function main (specifiedLocale, fix) {
  if (specifiedLocale) {
    console.log(`Verifying selected locale "${specifiedLocale}":\n\n`)
    const locale = localeIndex.find(localeMeta => localeMeta.code === specifiedLocale)
    const failed = locale.code === 'en' ?
      await verifyEnglishLocale(fix) :
      await verifyLocale(locale, fix)
    if (failed) {
      process.exit(1)
    }
  } else {
    console.log('Verifying all locales:\n\n')
    let failed = await verifyEnglishLocale(fix)
    const localeCodes = localeIndex
      .filter(localeMeta => localeMeta.code !== 'en')
      .map(localeMeta => localeMeta.code)

    for (const code of localeCodes) {
      const localeFailed = await verifyLocale(code, fix)
      failed = failed || localeFailed
      console.log('\n')
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
      console.log('Locale file not found')
    } else {
      console.log(`Error opening your locale ("${code}") file: `, e)
    }
    process.exit(1)
  }
}

async function writeLocale (code, locale) {
  try {
    const localeFilePath = getLocalePath(code)
    return writeFile(localeFilePath, JSON.stringify(locale, null, 2) + '\n', 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Locale file not found')
    } else {
      console.log(`Error writing your locale ("${code}") file: `, e)
    }
    process.exit(1)
  }
}

async function verifyLocale (code, fix = false) {
  const englishLocale = await getLocale('en')
  const targetLocale = await getLocale(code)

  const extraItems = compareLocalesForMissingItems({ base: targetLocale, subject: englishLocale })
  const missingItems = compareLocalesForMissingItems({ base: englishLocale, subject: targetLocale })

  const englishEntryCount = Object.keys(englishLocale).length
  const coveragePercent = 100 * (englishEntryCount - missingItems.length) / englishEntryCount

  console.log(`Status of **${code}** ${coveragePercent.toFixed(2)}% coverage:`)

  if (extraItems.length) {
    console.log('\nExtra items that should not be localized:')
    extraItems.forEach(function (key) {
      console.log(`  - [ ] ${key}`)
    })
  } else {
    // console.log(`  all ${counter} strings declared in your locale ("${code}") were found in the english one`)
  }

  if (missingItems.length) {
    console.log(`\nMissing items not present in localized file:`)
    missingItems.forEach(function (key) {
      console.log(`  - [ ] ${key}`)
    })
  } else {
    // console.log(`  all ${counter} english strings were found in your locale ("${code}")!`)
  }

  if (!extraItems.length && !missingItems.length) {
    console.log('Full coverage  : )')
  }

  if (extraItems.length > 0) {
    if (fix) {
      const newLocale = Object.assign({}, targetLocale)
      for (const item of extraItems) {
        delete newLocale[item]
      }
      await writeLocale(code, newLocale)
    }
    return true
  }
}

async function verifyEnglishLocale (fix = false) {
  const englishLocale = await getLocale('en')
  const javascriptFiles = await findJavascriptFiles(path.resolve(__dirname, '..', 'ui'))

  const regex = /'(\w+)'/g
  const usedMessages = new Set()
  for await (const fileContents of getFileContents(javascriptFiles)) {
    for (const match of matchAll.call(fileContents, regex)) {
      usedMessages.add(match[1])
    }
  }

  // never consider these messages as unused
  const messageExceptions = ['appName', 'appDescription']

  const englishMessages = Object.keys(englishLocale)
  const unusedMessages = englishMessages
    .filter(message => !messageExceptions.includes(message) && !usedMessages.has(message))

  console.log(`Status of **English (en)** ${unusedMessages.length} unused messages:`)

  if (unusedMessages.length === 0) {
    console.log('Full coverage  : )')
    return false
  }

  console.log(`\nMessages not present in UI:`)
  unusedMessages.forEach(function (key) {
    console.log(`  - [ ] ${key}`)
  })

  if (unusedMessages.length > 0 && fix) {
    const newLocale = Object.assign({}, englishLocale)
    for (const key of unusedMessages) {
      delete newLocale[key]
    }
    await writeLocale('en', newLocale)
  }

  return true
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
