const { deepStrictEqual, AssertionError } = require('node:assert');
const { getLocale } = require('../../lib/locales');

/**
 * Validate that en_GB locale is identical to en locale
 * @param {Object} locale - English locale object (not used, loads both internally)
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validate(locale, options = {}) {
  try {
    const englishLocale = await getLocale('en');
    const englishGbLocale = await getLocale('en_GB');

    deepStrictEqual(
      englishLocale,
      englishGbLocale,
      'en_GB should be identical to en',
    );

    return {
      passed: true,
      differences: [],
    };
  } catch (error) {
    if (!(error instanceof AssertionError)) {
      throw error;
    }

    return {
      passed: false,
      error,
      differences: ['en_GB differs from en'],
    };
  }
}

/**
 * Fix en_GB by syncing it with en
 * @param {Object} locale - Not used (loads en internally)
 * @param {Object} options - Fix options
 * @returns {Object} The en locale to be written to en_GB
 */
async function fix(locale, options = {}) {
  const englishLocale = await getLocale('en');
  return englishLocale;
}

/**
 * Report en_GB validation results
 * @param {Object} results - Validation results
 * @param {Object} options - Reporting options
 */
function report(results, options = {}) {
  if (!results.passed && results.error) {
    console.error(results.error);
  }
}

module.exports = {
  name: 'en-gb-sync',
  validate,
  fix,
  report,
  // Special flag to indicate this validator needs special handling
  runsOnce: true,
  targetLocale: 'en_GB',
};
