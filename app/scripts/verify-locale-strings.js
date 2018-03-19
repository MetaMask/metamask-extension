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

var fs = require('fs')
var path = require('path')

console.log('Locale Verification')

var locale = process.argv[2]
if (!locale || locale == '') {
	console.log('Must enter a locale as argument. exitting')
	process.exit(1)
}

console.log("verifying for locale " + locale)

localeFilePath = path.join(process.cwd(), 'app', '_locales', locale, 'messages.json')
try {
	localeObj = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'));
} catch (e) {
	if(e.code == 'ENOENT') {
		console.log('Locale file not found') 
	} else {
		console.log('Error opening your locale file: ', e)
	}
	process.exit(1)
}

englishFilePath = path.join(process.cwd(), 'app', '_locales', 'en', 'messages.json')
try {
	englishObj = JSON.parse(fs.readFileSync(englishFilePath, 'utf8'));
} catch (e) {
	if(e.code == 'ENOENT') {
		console.log("English File not found") 
	} else {
		console.log("Error opening english locale file: ", e)
	}
	process.exit(1)
}

console.log('\tverifying whether all your locale strings are contained in the english one')

var counter = 0
var foundError = false
var notFound = [];
Object.keys(localeObj).forEach(function(key){
	if (!englishObj[key]) {
		foundError = true
		notFound.push(key)
	}
	counter++
})

if (foundError) {
	console.log('\nThe following string(s) is(are) not found in the english locale:')
	notFound.forEach(function(key) {
		console.log(key)
	})
	process.exit(1)
}

console.log('\tall ' + counter +' strings declared in your locale were found in the english one')

console.log('\n\tverifying whether your locale contains all english strings')

var counter = 0
var foundError = false
var notFound = [];
Object.keys(englishObj).forEach(function(key){
	if (!localeObj[key]) {
		foundError = true
		notFound.push(key)
	}
	counter++
})

if (foundError) {
	console.log('\nThe following string(s) is(are) not found in the your locale:')
	notFound.forEach(function(key) {
		console.log(key)
	})
	process.exit(1)
}

console.log('\tall ' + counter +' english strings were found in your locale!')

console.log('You are good to go')