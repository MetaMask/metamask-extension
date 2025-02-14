const fs = require('fs');
const path = require('path');

const BASE_PATH = path.resolve(__dirname, '..', '..');
const CHANGED_FILES_PATH = path.join(
  BASE_PATH,
  'changed-files',
  'changed-files.txt',
);

/**
 * Reads the list of changed files from the git diff file with status (A, M, D).
 *
 * @returns {string[]} An array of changed file paths.
 */
function readChangedAndNewFilesWithStatus() {
  try {
    const data = fs.readFileSync(CHANGED_FILES_PATH, 'utf8');
    const changedFiles = data.split('\n').filter(Boolean);
    return changedFiles.map((line) => {
      const [status, filePath] = line.split('\t');
      return { status, filePath };
    });
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
 * @param {string[]} changedFilesPaths - An array of changed file paths to filter.
 * @returns {string[]} An array of filtered E2E test file paths.
 */
function filterE2eChangedFiles(changedFilesPaths) {
  const e2eChangedFiles = changedFilesPaths
    .filter(
      (file) =>
        file.startsWith('test/e2e/') &&
        (file.endsWith('.spec.js') || file.endsWith('.spec.ts')),
    )
    .map((file) => `${BASE_PATH}/${file}`);
  return e2eChangedFiles;
}

/**
 * Filters the list of changed files to include only new files.
 *
 * @param {Array<{status: string, filePath: string}>} changedFiles - An array of changed file objects.
 * @returns {string[]} An array of new file paths.
 */
function getNewFilesOnly(changedFiles) {
  return changedFiles
    .filter((file) => file.status === 'A')
    .map((file) => file.filePath);
}

/**
 * Filters the list of changed files to include only modified files.
 *
 * @param {Array<{status: string, filePath: string}>} changedFiles - An array of changed file objects.
 * @returns {string[]} An array of modified file paths.
 */
function getChangedFilesOnly(changedFiles) {
  return changedFiles
    .filter((file) => file.status === 'M')
    .map((file) => file.filePath);
}

/**
 * Filters the list of changed files to include both new and modified files.
 *
 * @param {Array<{status: string, filePath: string}>} changedFiles - An array of changed file objects.
 * @returns {string[]} An array of new and modified file paths.
 */
function getChangedAndNewFiles(changedFiles) {
  return changedFiles.map((file) => file.filePath);
}

module.exports = {
  filterE2eChangedFiles,
  getChangedAndNewFiles,
  getChangedFilesOnly,
  getNewFilesOnly,
  readChangedAndNewFilesWithStatus,
};
