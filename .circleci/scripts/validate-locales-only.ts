const { readChangedAndNewFilesWithStatus, getChangedAndNewFiles } = require('../../test/e2e/changedFilesUtil.js');

/**
 * Verifies that all changed files are in the /_locales/ directory.
 * Fails the build if any changed files are outside of the /_locales/ directory.
 * Fails if no changed files are detected.
 */
function validateLocalesOnlyChangedFiles() {
  const changedAndNewFilesWithStatus = readChangedAndNewFilesWithStatus();
  const changedFiles = getChangedAndNewFiles(changedAndNewFilesWithStatus);
  if (!changedFiles || changedFiles.length === 0) {
    console.error('Failure: No changed files detected.');
    process.exit(1);
  }
  const invalidFiles = changedFiles.filter(
    (file) => !file.startsWith('app/_locales/'),
  );
  if (invalidFiles.length > 0) {
    console.error(
      'Failure: Changed files must be in the /_locales/ directory.\n Changed Files:',
      changedFiles,
      '\n Invalid Files:',
      invalidFiles,
    );
    process.exit(1);
  } else {
    console.log('Passed validation');
    process.exit(0);
  }
}

validateLocalesOnlyChangedFiles();
