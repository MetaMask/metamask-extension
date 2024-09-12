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
    return [];
  }
}

/**
 * Filters the list of changed files to include only E2E test files within the 'test/e2e/' directory.
 * Also checks if all changed files have either .md or .csv extensions.
 *
 * @returns {Promise<{ e2eChangedFiles: string[], hasOnlyMdOrCsvFiles: boolean }>} An object containing the filtered E2E test file paths and a boolean indicating if all files have .md or .csv extensions.
 */
async function filterE2eChangedFiles() {
  const changedFiles = await readChangedFiles();
  const e2eChangedFiles = changedFiles
    .filter(
      (file) =>
        file.startsWith('test/e2e/') &&
        (file.endsWith('.spec.js') || file.endsWith('.spec.ts')),
    )
    .map((file) => `${BASE_PATH}/${file}`);

    const hasOnlyMdOrCsvFiles = changedFiles.every(
      (file) => file.endsWith('.md') || file.endsWith('.csv')
    );

  return {e2eChangedFiles, hasOnlyMdOrCsvFiles};
}

module.exports = { filterE2eChangedFiles, readChangedFiles, checkOnlyMdOrCsvFiles };
