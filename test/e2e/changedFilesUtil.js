const fs = require('fs').promises;
const path = require('path');

const BASE_PATH = path.resolve(__dirname, '..', '..');
const CHANGED_FILES_PATH = path.join(
  BASE_PATH,
  'changed-files',
  'changed-files.txt',
);

/**
 * Reads the list of changed files from the git diff file.
 *
 * @returns {Promise<string[]>} An array of changed file paths.
 */
async function readChangedFiles() {
  try {
    const data = await fs.readFile(CHANGED_FILES_PATH, 'utf8');
    const changedFiles = data.split('\n');
    return changedFiles;
  } catch (error) {
    console.error('Error reading from file:', error);
    return '';
  }
}

/**
 * Filters the list of changed files to include only E2E test files within the 'test/e2e/' directory.
 * It excludes the 'vault-decryption-chrome.spec.js' test, as it only runs on develop or RC branches in a separate job.
 *
 * @returns {Promise<string>} A string containing paths of the E2E changed files,
 *                            joined by newlines.
 */
async function filterE2eChangedFiles() {
  const changedFiles = await readChangedFiles();
  const e2eChangedFiles = changedFiles
    .filter(
      (file) =>
        file.startsWith('test/e2e/') &&
        (file.endsWith('.spec.js') || file.endsWith('.spec.ts')) &&
        file !== 'test/e2e/vault-decryption-chrome.spec.js',
    )
    .map((file) => `${BASE_PATH}${file}`)
    .join('\n');
  return e2eChangedFiles;
}

module.exports = { filterE2eChangedFiles };
