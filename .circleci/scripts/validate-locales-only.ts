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
async function readChangedFiles(): Promise<string[]>{
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
 * Verifies that all changed files are in the /_locales/ directory.
 * Fails the build if any changed files are outside of the /_locales/ directory.
 * Fails if no changed files are detected.
 */
async function validateChangedFiles() {
  const changedFiles = await readChangedFiles();
  const invalidFiles = changedFiles.filter((file) => !file.startsWith('app/_locales/'));
  if (invalidFiles.length > 0) {
    console.error('Failure: Changed files must be in the /_locales/ directory.\n Changed Files:', changedFiles, '\n Invalid Files:', invalidFiles);
    process.exit(1);
  }
  else if (changedFiles.length === 0) {
    console.error('Failure: No changed files detected.');
    process.exit(1);
  } else {
    console.log('Passed validation');
    process.exit(0);
  }
}

validateChangedFiles();