/**
 * Wrapper to export Jest's SummaryReporter for use in jest.config.js
 *
 * This is needed because Node v24 strictly enforces package exports,
 * and we can't directly access '@jest/reporters/build/SummaryReporter'.
 * Instead, we import it from the main exports and re-export it.
 *
 * See: https://github.com/jevakallio/jest-clean-console-reporter
 */

const { SummaryReporter } = require('@jest/reporters');

module.exports = SummaryReporter;
