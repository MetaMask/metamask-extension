const { ESLint } = require('eslint');
const eslintrc = require('../../../.eslintrc');

// We want to lint the transformed files to ensure that they are valid.
// We only need a singleton instance of ESLint. This file contains utilities
// for configuring and initializing that instance.

eslintrc.overrides.forEach((override) => {
  const rules = override.rules ?? {};

  // We don't want linting to fail for purely stylistic reasons.
  rules['prettier/prettier'] = 'off';
  // Sometimes we use `let` instead of `const` to assign variables depending on
  // the build type.
  rules['prefer-const'] = 'off';

  override.rules = rules;
});

// Remove all test-related overrides. We will never lint test files here.
eslintrc.overrides = eslintrc.overrides.filter((override) => {
  return !(
    (override.extends &&
      override.extends.find(
        (configName) =>
          configName.includes('jest') || configName.includes('mocha'),
      )) ||
    (override.plugins &&
      override.plugins.find((pluginName) => pluginName.includes('jest')))
  );
});

/**
 * The singleton ESLint instance.
 *
 * @type {ESLint}
 */
let eslintInstance;

/**
 * Gets a singleton ESLint instance, initializing it if necessary.
 *
 * @returns {ESLint} The singleton ESLint instance.
 */
const getESLintInstance = () => {
  if (!eslintInstance) {
    eslintInstance = new ESLint({ baseConfig: eslintrc, useEslintrc: false });
  }
  return eslintInstance;
};

module.exports = {
  getESLintInstance,
};
