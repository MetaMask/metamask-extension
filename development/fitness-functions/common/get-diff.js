const { execSync } = require('child_process');
const fs = require('fs');
const { AUTOMATION_TYPE } = require('./constants');

function getDiffByAutomationType(automationType) {
  if (!Object.values(AUTOMATION_TYPE).includes(automationType)) {
    console.error('Invalid automation type.');
    process.exit(1);
  }

  let diff;
  if (automationType === AUTOMATION_TYPE.CI) {
    const optionalArguments = process.argv.slice(3);
    if (optionalArguments.length !== 1) {
      console.error('Invalid number of arguments.');
      process.exit(1);
    }

    diff = fs.readFileSync(optionalArguments[0], {
      encoding: 'utf8',
      flag: 'r',
    });
  } else if (automationType === AUTOMATION_TYPE.PRE_COMMIT_HOOK) {
    diff = getPreCommitHookDiff();
  } else if (automationType === AUTOMATION_TYPE.PRE_PUSH_HOOK) {
    diff = getPrePushHookDiff();
  }

  return diff;
}

function getPreCommitHookDiff() {
  return execSync(`git diff --cached HEAD`).toString().trim();
}

function getPrePushHookDiff() {
  const currentBranch = execSync(`git rev-parse --abbrev-ref HEAD`)
    .toString()
    .trim();

  return execSync(
    `git diff ${currentBranch} origin/${currentBranch} -- . ':(exclude)development/fitness-functions/'`,
  )
    .toString()
    .trim();
}

module.exports = { getDiffByAutomationType };
