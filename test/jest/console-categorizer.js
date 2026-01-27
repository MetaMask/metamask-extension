/**
 * Shared console message categorization module.
 *
 * This module provides a unified way to categorize console messages using
 * the same rules as jest-clean-console-reporter. This ensures consistency
 * between:
 * - Console output grouping (jest-clean-console-reporter)
 * - Baseline tracking (console-baseline-reporter)
 *
 * Note: This file is intentionally JavaScript (not TypeScript) because Jest
 * reporters and configuration files are traditionally JS. The main jest.config.js
 * is also JavaScript. Converting to TypeScript would require additional build
 * steps for Jest infrastructure files.
 *
 * @module console-categorizer
 */

const unitRules = require('./console-reporter-rules-unit');
const integrationRules = require('./console-reporter-rules-integration');

/**
 * Categorize a console message using the provided rules.
 *
 * @param {string} type - Console message type (log, warn, error, etc.)
 * @param {string} message - Console message text
 * @param {Array} rules - Array of categorization rules
 * @returns {string|null} Category name, or null if message should be ignored
 */
function categorizeWithRules(type, message, rules) {
  for (const rule of rules) {
    const { match, group } = rule;

    let isMatch = false;

    if (typeof match === 'function') {
      // Function matcher: (message, level) => boolean
      isMatch = match(message, type);
    } else if (match instanceof RegExp) {
      // RegExp matcher
      isMatch = match.test(message);
    } else if (typeof match === 'string') {
      // String matcher (exact substring)
      isMatch = message.includes(match);
    }

    if (isMatch) {
      // Return group name, or null to ignore
      return group;
    }
  }

  // No rule matched - create a fallback category
  return createFallbackCategory(type, message);
}

/**
 * Create a fallback category for uncategorized messages.
 *
 * @param {string} type - Console message type
 * @param {string} message - Console message text
 * @returns {string} Fallback category name
 */
function createFallbackCategory(type, message) {
  // Use type and first few words for uncategorized messages
  const firstLine = message.split('\n')[0];
  const firstWords = firstLine.split(' ').slice(0, 5).join(' ');
  const truncated =
    firstWords.length > 60 ? `${firstWords.substring(0, 60)}...` : firstWords;
  return `${type}: ${truncated}`;
}

/**
 * Categorize a console message for unit tests.
 * Uses rules from console-reporter-rules-unit.js.
 *
 * @param {string} type - Console message type (log, warn, error, etc.)
 * @param {string} message - Console message text
 * @returns {string|null} Category name, or null if message should be ignored
 */
function categorizeUnitTestMessage(type, message) {
  return categorizeWithRules(type, message, unitRules);
}

/**
 * Categorize a console message for integration tests.
 * Uses rules from console-reporter-rules-integration.js.
 *
 * @param {string} type - Console message type (log, warn, error, etc.)
 * @param {string} message - Console message text
 * @returns {string|null} Category name, or null if message should be ignored
 */
function categorizeIntegrationTestMessage(type, message) {
  return categorizeWithRules(type, message, integrationRules);
}

module.exports = {
  categorizeUnitTestMessage,
  categorizeIntegrationTestMessage,
  createFallbackCategory,
};
