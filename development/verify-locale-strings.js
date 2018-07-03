// //////////////////////////////////////////////////////////////////////////////
//
// Locale verification script
//
// usage:
//
//     node app/scripts/verify-locale-strings.js <locale>
//
// will check the given locale against the strings in english
//
// //////////////////////////////////////////////////////////////////////////////

const fs = require('fs')
const path = require('path')
const localeIndex = require('../app/_locales/index.json')

console.log('Locale Verification')

const specifiedLocale = process.argv[2]
if (specifiedLocale) {
	console.log(`Verifying selected locale "${specifiedLocale}":\n\n`)
	const locale = localeIndex.find(localeMeta => localeMeta.code === specifiedLocale)
	verifyLocale({ locale })
} else {
	console.log('Verifying all locales:\n\n')
	localeIndex.forEach(localeMeta => {
		verifyLocale({ localeMeta })
		console.log('\n')
	})
}


function verifyLocale ({ localeMeta }) {
	const localeCode = localeMeta.code
	const localeName = localeMeta.name
	let targetLocale, englishLocale

	try {
		const localeFilePath = path.join(process.cwd(), 'app', '_locales', localeCode, 'messages.json')
		targetLocale = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'))
	} catch (e) {
		if (e.code === 'ENOENT') {
			console.log('Locale file not found')
		} else {
			console.log(`Error opening your locale ("${localeCode}") file: `, e)
		}
		process.exit(1)
	}

	try {
		const englishFilePath = path.join(process.cwd(), 'app', '_locales', 'en', 'messages.json')
		englishLocale = JSON.parse(fs.readFileSync(englishFilePath, 'utf8'))
	} catch (e) {
		if (e.code === 'ENOENT') {
			console.log('English File not found')
		} else {
			console.log('Error opening english locale file: ', e)
		}
		process.exit(1)
	}

	// console.log('  verifying whether all your locale ("${localeCode}") strings are contained in the english one')
	const extraItems = compareLocalesForMissingItems({ base: targetLocale, subject: englishLocale })
	// console.log('\n  verifying whether your locale ("${localeCode}") contains all english strings')
	const missingItems = compareLocalesForMissingItems({ base: englishLocale, subject: targetLocale })

	const englishEntryCount = Object.keys(englishLocale).length
	const coveragePercent = 100 * (englishEntryCount - missingItems.length) / englishEntryCount

	console.log(`Status of **${localeName} (${localeCode})** ${coveragePercent.toFixed(2)}% coverage:`)

	if (extraItems.length) {
		console.log('\nMissing from english locale:')
		extraItems.forEach(function (key) {
			console.log(`  - [ ] ${key}`)
		})
	} else {
		// console.log(`  all ${counter} strings declared in your locale ("${localeCode}") were found in the english one`)
	}

	if (missingItems.length) {
		console.log(`\nMissing:`)
		missingItems.forEach(function (key) {
			console.log(`  - [ ] ${key}`)
		})
	} else {
		// console.log(`  all ${counter} english strings were found in your locale ("${localeCode}")!`)
	}

	if (!extraItems.length && !missingItems.length) {
		console.log('Full coverage  : )')
	}
}

function compareLocalesForMissingItems ({ base, subject }) {
	return Object.keys(base).filter((key) => !subject[key])
}
