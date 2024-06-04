const fs = require('fs').promises;
const path = require('path');

const CHANGED_FILES_PATH = path.join(
  __dirname,
  'changed-files',
  'changed-files.txt',
);

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
        file.filename.startsWith('test/e2e/') &&
        (file.filename.endsWith('.spec.js') ||
          file.filename.endsWith('.spec.ts')),
    )
    .map((file) => file.filename)
    .join('\n');

  return e2eChangedFiles;
}

module.exports = { filterE2eChangedFiles };
