const fs = require('fs').promises;
const path = require('path');

const CHANGED_FILES_PATH = path.join(
  __dirname,
  'changed-files',
  'changed-files.txt',
);

async function fetchChangedE2eFiles() {
  try {
    const data = await fs.readFile(CHANGED_FILES_PATH, 'utf8');
    const changedFiles = data.split('\n');

    const changedE2eFiles = changedFiles
      .filter(
        (file) =>
          file.filename.startsWith('test/e2e/') &&
          (file.filename.endsWith('.spec.js') ||
            file.filename.endsWith('.spec.ts')),
      )
      .map((file) => file.filename)
      .join('\n');

    return changedE2eFiles;
  } catch (error) {
    console.error('Error making request:', error);
    return '';
  }
}

module.exports = { fetchChangedE2eFiles };
