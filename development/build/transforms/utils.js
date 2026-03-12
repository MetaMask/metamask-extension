const { ESLint } = require('eslint');

// We want to lint the transformed files to ensure that they are valid.
// We only need a singleton instance of ESLint. This file contains utilities
// for configuring and initializing that instance.
//
// With ESLint v9+ and flat config, we use the project's eslint.config.mjs and
// apply overrides to disable purely stylistic rules that would fail on
// transformed code.

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
    eslintInstance = new ESLint({
      overrideConfig: [
        {
          rules: {
            // We don't want linting to fail for purely stylistic reasons.
            'prettier/prettier': 'off',
            // Sometimes we use `let` instead of `const` to assign variables
            // depending on the build type.
            'prefer-const': 'off',
          },
        },
      ],
    });
  }
  return eslintInstance;
};

module.exports = {
  getESLintInstance,
};
