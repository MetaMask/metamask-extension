const fs = require('fs').promises;

const BASE_PATH = '/home/circleci/project/';
const CHANGED_FILES_PATH = `${BASE_PATH}changed-files/changed-files.txt`;

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

async function filterE2eChangedFiles() {
  const changedFiles = await readChangedFiles();
  const e2eChangedFiles = changedFiles
    .filter(
      (file) =>
        file.startsWith('test/e2e/') &&
        (file.endsWith('.spec.js') || file.endsWith('.spec.ts')),
    )
    .map((file) => `${BASE_PATH}${file}`)
    .join('\n');
  return e2eChangedFiles;
}

module.exports = { filterE2eChangedFiles };
