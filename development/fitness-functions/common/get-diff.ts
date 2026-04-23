import {
  execFileSync,
  type ExecFileSyncOptionsWithStringEncoding,
} from 'child_process';
import fs from 'fs';

import { AUTOMATION_TYPE } from './constants';

const GIT_EXEC_FILE_OPTIONS: ExecFileSyncOptionsWithStringEncoding = {
  encoding: 'utf8',
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
    if (optionalArguments.length > 1) {
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

function getCIDiff(path?: string): string {
  if (path) {
    return fs.readFileSync(path, {
      encoding: 'utf8',
      flag: 'r',
    });
  }

  // No file argument — fetch diff directly (requires CI environment variables).
  // Lazy-import to avoid pulling @actions/github into local dev hooks.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require
  const { getPrDiff } = require('../../../.github/scripts/shared/get-pr-diff');
  return getPrDiff({ baseBranch: process.env.BASE_REF || 'main' });
}

function runGitCommand(args: string[]): string {
  return execFileSync('git', args, GIT_EXEC_FILE_OPTIONS).trim();
}

function getPreCommitHookDiff(): string {
  return runGitCommand(['diff', '--cached', 'HEAD']);
}

function getPrePushHookDiff(): string {
  const currentBranch = runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD']);

  return runGitCommand([
    'diff',
    currentBranch,
    `origin/${currentBranch}`,
    '--',
    '.',
    ':(exclude)development/fitness-functions/',
  ]);
}

export { getDiffByAutomationType };
