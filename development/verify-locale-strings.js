////////////////////////////////////////////////////////////////////////////////
//
// Locale verification script
//
// usage:
//
//     node app/scripts/verify-locale-strings.js <locale>
//
// will check the given locale against the strings in english
//
////////////////////////////////////////////////////////////////////////////////

const fs = require('fs')
const path = require('path')
const locales = require('../app/_locales/index.json')

console.log('Locale Verification')

const specifiedLocale = process.argv[2]
if (specifiedLocale) {
	console.log(`Verifying selected locale "${specifiedLocale}":\n\n`)
	const locale = locales.find(locale => locale.code === specifiedLocale)
	verifyLocale({ locale })
} else {
	console.log('Verifying all locales:\n\n')
	locales.forEach(locale => {
		verifyLocale({ locale })
		console.log('\n')
	})
}



function verifyLocale({ locale }) {
	const localeCode = locale.code
	const localeName = locale.name
	console.log(`Status of "${localeName}" (${localeCode})`)

	try {
		const localeFilePath = path.join(process.cwd(), 'app', '_locales', localeCode, 'messages.json')
		localeObj = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'));
	} catch (e) {
		if (e.code == 'ENOENT') {
			console.log('Locale file not found')
		} else {
			console.log(`Error opening your locale ("${localeCode}") file: `, e)
		}
		process.exit(1)
	}

	try {
		const englishFilePath = path.join(process.cwd(), 'app', '_locales', 'en', 'messages.json')
		englishObj = JSON.parse(fs.readFileSync(englishFilePath, 'utf8'));
	} catch (e) {
		if(e.code == 'ENOENT') {
			console.log('English File not found')
		} else {
			console.log('Error opening english locale file: ', e)
		}
		process.exit(1)
	}

	// console.log('  verifying whether all your locale ("${localeCode}") strings are contained in the english one')

	var counter = 0
	var foundErrorA = false
	var notFound = [];
	Object.keys(localeObj).forEach(function(key){
		if (!englishObj[key]) {
			foundErrorA = true
			notFound.push(key)
		}
		counter++
	})

	if (foundErrorA) {
		console.log('\nMissing from english locale:')
		notFound.forEach(function(key) {
			console.log(`  - [ ] ${key}`)
		})
	} else {
		// console.log(`  all ${counter} strings declared in your locale ("${localeCode}") were found in the english one`)
	}

	// console.log('\n  verifying whether your locale ("${localeCode}") contains all english strings')

	var counter = 0
	var foundErrorB = false
	var notFound = [];
	Object.keys(englishObj).forEach(function(key){
		if (!localeObj[key]) {
			foundErrorB = true
			notFound.push(key)
		}
		counter++
	})

	if (foundErrorB) {
		console.log(`\nMissing from "${localeCode}":`)
		notFound.forEach(function(key) {
			console.log(`  - [ ] ${key}`)
		})
	} else {
		// console.log(`  all ${counter} english strings were found in your locale ("${localeCode}")!`)
	}

	if (!foundErrorA && !foundErrorB) {
		console.log('You are good to go')
	}
}
