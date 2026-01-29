const sentenceCaseExceptions = require('../../../app/_locales/sentence-case-exceptions.json');

/**
 * Build and compile a single regex from all exceptions for performance
 * @param {Object} exceptions - Exception rules from sentence-case-exceptions.json
 * @returns {RegExp} Compiled regex matching all exceptions
 */
function buildExceptionsRegex(exceptions) {
  const patterns = [];

  // Escape special regex characters for exact matches
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

  // Add exact matches (escaped to treat as literals)
  exceptions.exactMatches.forEach((term) => {
    patterns.push(escapeRegex(term));
  });

  // Add acronyms (escaped to treat as literals)
  exceptions.acronyms.forEach((acronym) => {
    patterns.push(escapeRegex(acronym));
  });

  // Add existing regex patterns (already in regex format)
  Object.values(exceptions.patterns).forEach((pattern) => {
    patterns.push(pattern);
  });

  // Combine all patterns with OR operator
  return new RegExp(patterns.join('|'), 'u');
}

// Pre-compile the exceptions regex once at module load time
const specialCaseRegex = buildExceptionsRegex(sentenceCaseExceptions);

/**
 * Check if text contains special case terms
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains special case terms
 */
function containsSpecialCase(text) {
  return specialCaseRegex.test(text);
}

module.exports = {
  buildExceptionsRegex,
  containsSpecialCase,
  specialCaseRegex,
  sentenceCaseExceptions,
};
