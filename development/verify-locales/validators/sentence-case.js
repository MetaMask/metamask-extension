const log = require('loglevel');
const { containsSpecialCase } = require('../utils/exceptions');
const { toSentenceCase } = require('../utils/case-conversion');

/**
 * Detect title case violations in text
 * @param {string} text - Text to check
 * @returns {boolean} True if text has title case violations
 */
function hasTitleCaseViolation(text) {
  // Remove quoted text (single quotes and escaped double quotes) before checking
  // Quoted text refers to UI elements and should preserve capitalization
  let textWithoutQuotes = text.replace(/'[^']*'/gu, ''); // Remove 'text'
  textWithoutQuotes = textWithoutQuotes.replace(/\\"[^"]*\\"/gu, ''); // Remove \"text\"

  // Ignore single words (filter out empty strings from whitespace)
  const words = textWithoutQuotes
    .split(/\s+/u)
    .filter((word) => word.length > 0);
  if (words.length < 2) {
    return false;
  }

  // Check if multiple words start with capital letters (Title Case pattern)
  // This pattern: "Word Word" or "Word Word Word"
  const titleCasePattern = /^([A-Z][a-z]+\s+)+[A-Z][a-z]+/u;

  // Also catch patterns like "In Progress", "Not Available"
  const multipleCapsPattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/u;

  return (
    titleCasePattern.test(textWithoutQuotes) ||
    multipleCapsPattern.test(textWithoutQuotes)
  );
}

/**
 * Validate sentence case compliance for a locale
 * @param {Object} locale - Locale object to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validate(locale, options = {}) {
  const violations = [];

  for (const [key, value] of Object.entries(locale)) {
    if (!value || !value.message) {
      continue;
    }

    const text = value.message;

    // Skip if contains special cases
    if (containsSpecialCase(text)) {
      continue;
    }

    // Check for title case violations
    if (hasTitleCaseViolation(text)) {
      const suggested = toSentenceCase(text);
      violations.push({
        key,
        current: text,
        suggested,
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    count: violations.length,
  };
}

/**
 * Fix sentence case violations
 * @param {Object} locale - Locale object to fix
 * @param {Object} options - Fix options
 * @returns {Object} Fixed locale object
 */
async function fix(locale, options = {}) {
  const newLocale = { ...locale };
  const result = await validate(locale, options);

  for (const violation of result.violations) {
    if (newLocale[violation.key]) {
      newLocale[violation.key].message = violation.suggested;
    }
  }

  return newLocale;
}

/**
 * Report sentence case validation results
 * @param {Object} results - Validation results
 * @param {Object} options - Reporting options
 */
function report(results, options = {}) {
  const { code = 'en' } = options;

  if (results.violations.length) {
    console.log(`**${code}**: ${results.count} sentence case violations`);
    log.info(`Messages not following sentence case:`);
    results.violations.forEach(function (violation) {
      log.info(
        `  - [ ] ${violation.key}: "${violation.current}" → "${violation.suggested}"`,
      );
    });
    log.info(
      `\nIf any of these capitalizations are correct (e.g., product names, proper nouns), add them to app/_locales/sentence-case-exceptions.json`,
    );
  }
}

module.exports = {
  name: 'sentence-case',
  validate,
  fix,
  report,
};
