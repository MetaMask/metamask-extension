import { fetchManifestFlagsFromPRAndGit } from '../../development/lib/get-manifest-flag';
import { readChangedAndFilterE2eChangedFiles } from '../../test/e2e/changedFilesUtil';

fetchManifestFlagsFromPRAndGit().then((manifestFlags) => {
  let timeout;

  if (manifestFlags.circleci?.timeoutMinutes) {
    timeout = manifestFlags.circleci?.timeoutMinutes;
  } else {
    const changedOrNewTests = readChangedAndFilterE2eChangedFiles();

    // 20 minutes, plus 3 minutes for every changed file, up to a maximum of 30 minutes
    timeout = Math.min(20 + changedOrNewTests.length * 3, 30);
  }

  // If this is the Merge Queue, add 10 minutes
  if (process.env.CIRCLE_BRANCH?.startsWith('gh-readonly-queue')) {
    timeout += 10;
  }

  // This is an essential log, that feeds into a bash script
  console.log(timeout);
});
