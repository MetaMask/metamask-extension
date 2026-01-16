const log = require('loglevel');
const { compareLocalesForMissingDescriptions } = require('../../lib/locales');

/**
 * Validate that target locale has all descriptions from English locale
 * @param {Object} locale - Target locale object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validate(locale, options = {}) {
  const { englishLocale } = options;

  if (!englishLocale) {
    throw new Error('englishLocale is required in options');
  }

  const missingDescriptions = compareLocalesForMissingDescriptions({
    englishLocale,
    targetLocale: locale,
  });

  return {
    passed: missingDescriptions.length === 0,
    missingDescriptions,
    count: missingDescriptions.length,
  };
}

/**
 * Fix missing descriptions by copying from English locale
 * @param {Object} locale - Target locale object to fix
 * @param {Object} options - Fix options
 * @returns {Object} Fixed locale object
 */
async function fix(locale, options = {}) {
  const { englishLocale } = options;

  if (!englishLocale) {
    throw new Error('englishLocale is required in options');
  }

  const newLocale = { ...locale };

  for (const message of Object.keys(englishLocale)) {
    if (englishLocale[message].description && newLocale[message]) {
      newLocale[message].description = englishLocale[message].description;
    }
  }

  return newLocale;
}

/**
 * Report missing descriptions validation results
 * @param {Object} results - Validation results
 * @param {Object} options - Reporting options
 */
function report(results, options = {}) {
  const { code } = options;

  if (results.missingDescriptions.length) {
    console.log(`**${code}**: ${results.count} missing descriptions`);
    log.info('Messages with missing descriptions:');
    results.missingDescriptions.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }
}

module.exports = {
  name: 'missing-descriptions',
  validate,
  fix,
  report,
  // Skipped for English locale
  nonEnglishOnly: true,
};
