import { execSync } from 'child_process';
import fs from 'fs';
import { AUTOMATION_TYPE } from './constants';

const GIT_EXEC_SYNC_OPTIONS = {
  maxBuffer: 50 * 1024 * 1024,
};

function getDiffByAutomationType(
  automationType: AUTOMATION_TYPE,
): string | undefined {
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

    diff = getCIDiff(optionalArguments[0]);
  } else if (automationType === AUTOMATION_TYPE.PRE_COMMIT_HOOK) {
    diff = getPreCommitHookDiff();
  } else if (automationType === AUTOMATION_TYPE.PRE_PUSH_HOOK) {
    diff = getPrePushHookDiff();
  }

  return diff;
}

function getCIDiff(path: string): string {
  return fs.readFileSync(path, {
    encoding: 'utf8',
    flag: 'r',
  });
}

function runGitCommand(command: string): string {
  return execSync(command, GIT_EXEC_SYNC_OPTIONS).toString().trim();
}

function getPreCommitHookDiff(): string {
  return runGitCommand('git diff --cached HEAD');
}

function getPrePushHookDiff(): string {
  const currentBranch = runGitCommand(`git rev-parse --abbrev-ref HEAD`);

  return runGitCommand(
    `git diff ${currentBranch} origin/${currentBranch} -- . ':(exclude)development/fitness-functions/'`,
  );
}

export { getDiffByAutomationType };
