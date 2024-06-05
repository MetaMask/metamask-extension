const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs');

async function gitDiff() {
  try {
    console.log("Last 10 commits current branch:");
    const { stdout: currentBranchLog } = await exec(`git log --oneline -n 10 ${process.env.CIRCLE_BRANCH}`);
    console.log(currentBranchLog);

    console.log("Last 10 commits develop:");
    const { stdout: developBranchLog } = await exec('git log --oneline -n 10 develop');
    console.log(developBranchLog);

    const { stdout: diffResult } = await exec(`git diff --name-only origin/develop...${process.env.CIRCLE_BRANCH}`);
    console.log(diffResult);

    // Create the directory
    fs.mkdirSync('changed-files', { recursive: true });

    // Store the output of git diff
    const { stdout: diffOutput } = await exec(`git diff --name-only origin/develop...${process.env.CIRCLE_SHA1}`);
    fs.writeFileSync('changed-files/changed-files.txt', diffOutput);

    console.log("Git diff results saved to changed-files/changed-files.txt");

    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

gitDiff();