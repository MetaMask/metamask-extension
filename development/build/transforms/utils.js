const { ESLint } = require('eslint');
const eslintrc = require('../../../.eslintrc.js');

/**
 * The singleton ESLint instance.
 *
 * @type {ESLint}
 */
let eslintInstance;

// We only need a single ESLint instance, and we only initialize it if necessary
const initializeESLint = () => {
  if (!eslintInstance) {
    eslintInstance = new ESLint({ baseConfig: eslintrc, useEslintrc: false });
  }
};

// Four spaces
const TAB = '    ';

module.exports = {
  lintTransformedFile,
};

/**
 * Lints a transformed file by invoking ESLint programmatically on the string
 * file contents. The path to the file must be specified so that the repository
 * ESLint config can be applied properly.
 *
 * An error is thrown if linting produced any errors, or if the file is ignored
 * by ESLint. Files linted by this function should never be ignored.
 *
 * @param {string} content - The file content.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<void>} Returns `undefined` or throws an error if linting produced
 * any errors, or if the linted file is ignored.
 */
async function lintTransformedFile(content, filePath) {
  initializeESLint();

  const lintResult = (
    await eslintInstance.lintText(content, { filePath, warnIgnored: false })
  )[0];

  // This indicates that the file is ignored, which should never be the case for
  // a transformed file.
  if (lintResult === undefined) {
    throw new Error(
      `MetaMask build: Transformed file "${filePath}" appears to be ignored by ESLint.`,
    );
  }

  // This is the success case
  if (lintResult.errorCount === 0) {
    return;
  }

  // Errors are stored in the messages array, and their "severity" is 2
  const errorsString = lintResult.messages
    .filter(({ severity }) => severity === 2)
    .reduce((allErrors, { message, ruleId }) => {
      return allErrors.concat(`${TAB}${ruleId}\n${TAB}${message}\n\n`);
    }, '');

  throw new Error(
    `MetaMask build: Lint errors encountered for transformed file "${filePath}":\n\n${errorsString}`,
  );
}
