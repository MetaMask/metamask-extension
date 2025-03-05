import { filterE2eChangedFiles, readChangedAndNewFilesWithStatus, getChangedAndNewFiles } from '../../test/e2e/changedFilesUtil';

function computeTimeout(): number {
  let timeout: number;

  // Use the GitHub Action provided timeout if it exists
  if (process.env.TIMEOUT) {
    timeout = parseInt(process.env.TIMEOUT, 10);
  } else {
    // Calculate timeout based on changed files:
    // Read the changed/new files and filter for e2e tests
    const changedAndNewFilesWithStatus = readChangedAndNewFilesWithStatus();
    const changedAndNewFiles = getChangedAndNewFiles(changedAndNewFilesWithStatus);
    const changedOrNewTests = filterE2eChangedFiles(changedAndNewFiles);

    // Base timeout of 20 minutes plus 3 minutes per changed file, capped at 30 minutes
    timeout = Math.min(20 + changedOrNewTests.length * 3, 30);
  }

  // Optionally, adjust timeout for merge queue scenarios.
  // For example, if the branch reference starts with 'refs/heads/gh-readonly-queue', add 10 minutes.
  if (process.env.GITHUB_REF?.startsWith('refs/heads/gh-readonly-queue')) {
    timeout += 10;
  }

  return timeout;
}

console.log(computeTimeout());
