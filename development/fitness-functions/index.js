const fs = require('fs');
const { execSync } = require('child_process');
const { checkMochaSyntax } = require('./check-mocha-syntax');

const AUTOMATION_TYPE = Object.freeze({
  CI: 'ci',
  PRE_COMMIT_HOOK: 'pre-commit-hook',
  PRE_PUSH_HOOK: 'pre-push-hook',
});

const automationType = process.argv[2];

if (automationType === AUTOMATION_TYPE.CI) {
  const optionalArguments = process.argv.slice(3);
  if (optionalArguments.length !== 1) {
    console.error('Invalid number of arguments.');
    process.exit(1);
  }

  const diff = fs.readFileSync(optionalArguments[0], {
    encoding: 'utf8',
    flag: 'r',
  });

  checkMochaSyntax(diff);
} else if (automationType === AUTOMATION_TYPE.PRE_COMMIT_HOOK) {
  const diff = getPreCommitHookDiff();

  checkMochaSyntax(diff);
} else if (automationType === AUTOMATION_TYPE.PRE_PUSH_HOOK) {
  const diff = getPrePushHookDiff();

  checkMochaSyntax(diff);
} else {
  console.error('Invalid automation type.');
  process.exit(1);
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
