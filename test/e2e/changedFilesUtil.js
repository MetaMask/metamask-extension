const fs = require('fs');
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
 * @returns {<string[]>} An array of changed file paths.
 */
function readChangedFiles() {
  try {
    const data = fs.readFileSync(CHANGED_FILES_PATH, 'utf8');
    const changedFiles = data.split('\n');
    return changedFiles;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error reading from file:', error);
    }
    return [];
  }
}

/**
 * Filters the list of changed files to include only E2E test files within the 'test/e2e/' directory.
 *
 * @returns {<string[]>} An array of filtered E2E test file paths.
 */
function filterE2eChangedFiles() {
  const changedFiles = readChangedFiles();
  const e2eChangedFiles = changedFiles
    .filter(
      (file) =>
        file.startsWith('test/e2e/') &&
        (file.endsWith('.spec.js') || file.endsWith('.spec.ts')),
    )
    .map((file) => `${BASE_PATH}/${file}`);
  return e2eChangedFiles;
}

module.exports = { filterE2eChangedFiles, readChangedFiles };
