// //////////////////////////////////////////////////////////////////////////////
//
// Reports on missing localized strings
//
// usage:
//
//     node app/scripts/missing-locale-strings.js [<locale>] [--verbose]
//
// This script will report on any missing localized strings. It will compare the
// chosen locale (or all locales, if none is chosen) with the `en` locale, and
// report the coverage percentage.
//
// The optional '--verbose' argument will print the key for each localized string
// to the console.
//
// //////////////////////////////////////////////////////////////////////////////

const log = require('loglevel');
const localeIndex = require('../app/_locales/index.json');
const { compareLocalesForMissingItems, getLocale } = require('./lib/locales');

log.setDefaultLevel('info');

let verbose = false;
let specifiedLocale;
for (const arg of process.argv.slice(2)) {
  if (arg === '--verbose') {
    verbose = true;
  } else {
    specifiedLocale = arg;
  }
}

main().catch((error) => {
  log.error(error);
  process.exit(1);
});

async function main() {
  if (specifiedLocale === 'en') {
    throw new Error(
      `Can't compare 'en' locale to itself to find missing messages`,
    );
  } else if (specifiedLocale) {
    await reportMissingMessages(specifiedLocale);
  } else {
    const localeCodes = localeIndex
      .filter((localeMeta) => localeMeta.code !== 'en')
      .map((localeMeta) => localeMeta.code);

    for (const code of localeCodes) {
      await reportMissingMessages(code);
    }
  }
}

async function reportMissingMessages(code) {
  const englishLocale = await getLocale('en');
  const targetLocale = await getLocale(code);

  const missingItems = compareLocalesForMissingItems({
    base: englishLocale,
    subject: targetLocale,
  });

  const englishEntryCount = Object.keys(englishLocale).length;
  const coveragePercent =
    (100 * (englishEntryCount - missingItems.length)) / englishEntryCount;

  log.info(`**${code}**: ${coveragePercent.toFixed(2)}% coverage`);
  if (missingItems.length && verbose) {
    console.log(`**${code}**: ${missingItems.length} missing messages`);
    log.info('Extra items that should not be localized:');
    missingItems.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }
}
