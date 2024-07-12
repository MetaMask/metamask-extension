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

async function validateChangedFiles() {
  const changedFiles = await readChangedFiles();
  const invalidFiles = changedFiles.filter((file) => !file.startsWith('app/_locales/'));
  if (invalidFiles.length > 0) {
    console.log('Changed Files:', changedFiles);
    console.error('Invalid files found:', invalidFiles);
    process.exit(1);
  }
  else {
    console.log('All changed files are in the /_locales/ directory.');
    process.exit(0);
  }
}

validateChangedFiles();