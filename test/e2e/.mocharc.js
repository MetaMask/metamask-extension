// This file exists to add mocha configuration options specific to our
// E2E Test suite.
module.exports = {
  // Registers tsx so that we may use the same TypeScript features in
  // E2E tests that we use elsewhere in our code.
  require: ['tsx/esm'],
  'node-option': ['import=tsx'],
  // Alter the built manifest before any test runs, and establish beforeEach and afterEach hooks.
  file: ['test/e2e/manifest-flag-mocha-hooks.ts'],
};
