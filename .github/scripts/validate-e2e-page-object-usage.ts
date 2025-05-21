import * as core from '@actions/core';
import fs from 'fs';
import { filterE2eChangedFiles } from '../../test/e2e/changedFilesUtil';

async function verifyE2ePageObjectsUsage(
  changeType: 'MODIFIED' | 'ADDED' | 'BOTH',
) {
  let e2eFiles: string[];

  const artifactName = 'changed-files.json';
  const artifactDir = 'changed-files';
  const artifactPath = `${artifactDir}/${artifactName}`;

  let changedFilesContent;

  try {
    changedFilesContent = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  } catch (error) {
    console.error('No artifacts found for changed files.');
    process.exit(0);
  }

  // Filter files based on the provided changeType
  const filteredFiles = changedFilesContent
    .filter((file) => {
      if (changeType === 'BOTH') {
        return file.changeType === 'MODIFIED' || file.changeType === 'ADDED';
      }
      return file.changeType === changeType;
    })
    .map((file) => file.path);

  e2eFiles = filterE2eChangedFiles(filteredFiles);
  console.log('Filtered E2E files:', e2eFiles);

  if (e2eFiles.length === 0) {
    console.log('No E2E files to validate. Exiting successfully.');
    process.exit(0);
  }

  let hasErrors = false;

  // Check each E2E file for page object usage
  for (const file of e2eFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Check for the presence of page object imports
      const usesPageObjectModel = content.includes('./page-objects/');

      if (!usesPageObjectModel) {
        core.error(
          `\x1b[31m You need to use Page Object Model in ${file}\x1b[0m`,
        );
        hasErrors = true;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`File not found: ${file}`);
        continue; // Skip this file because it was deleted, so no need to validate
      } else {
        throw error; // Re-throw if it's a different error
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log(
    '\x1b[32mSuccess: All the new or modified E2E files use the Page Object Model.\x1b[0m',
  );
}

// Run the verification for new files only
verifyE2ePageObjectsUsage('ADDED').catch((error) => {
  console.error('Not all the new e2e files use the Page Object Model', error);
  process.exit(1);
});
