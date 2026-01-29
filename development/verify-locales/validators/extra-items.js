const log = require('loglevel');
const { compareLocalesForMissingItems } = require('../../lib/locales');

/**
 * Validate that target locale doesn't have extra items not in English
 * @param {Object} locale - Target locale object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validate(locale, options = {}) {
  const { englishLocale } = options;

  if (!englishLocale) {
    throw new Error('englishLocale is required in options');
  }

  const extraItems = compareLocalesForMissingItems({
    base: locale,
    subject: englishLocale,
  });

  return {
    passed: extraItems.length === 0,
    extraItems,
    count: extraItems.length,
  };
}

/**
 * Fix extra items by removing them
 * @param {Object} locale - Target locale object to fix
 * @param {Object} options - Fix options
 * @returns {Object} Fixed locale object
 */
async function fix(locale, options = {}) {
  const result = await validate(locale, options);
  const newLocale = { ...locale };

  for (const item of result.extraItems) {
    delete newLocale[item];
  }

  return newLocale;
}

/**
 * Report extra items validation results
 * @param {Object} results - Validation results
 * @param {Object} options - Reporting options
 */
function report(results, options = {}) {
  const { code } = options;

  if (results.extraItems.length) {
    console.log(`**${code}**: ${results.count} unused messages`);
    log.info('Extra items that should not be localized:');
    results.extraItems.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }
}

module.exports = {
  name: 'extra-items',
  validate,
  fix,
  report,
  // Skipped for English locale
  nonEnglishOnly: true,
};
