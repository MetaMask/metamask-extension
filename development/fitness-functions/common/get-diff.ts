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

async function getDiffByAutomationType(
  automationType: AUTOMATION_TYPE,
): Promise<string | undefined> {
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

    diff = await getCIDiff(optionalArguments[0]);
  } else if (automationType === AUTOMATION_TYPE.PRE_COMMIT_HOOK) {
    diff = getPreCommitHookDiff();
  } else if (automationType === AUTOMATION_TYPE.PRE_PUSH_HOOK) {
    diff = getPrePushHookDiff();
  }

  return diff;
}

async function getCIDiff(path?: string): Promise<string> {
  if (path) {
    return fs.readFileSync(path, {
      encoding: 'utf8',
      flag: 'r',
    });
  }

  // No file argument — fetch diff directly (requires CI environment variables).
  // Lazy dynamic import to avoid pulling @actions/github into local dev hooks
  // (and because @actions/github is now ESM-only).
  const { getPrDiff } =
    await import('../../../.github/scripts/shared/get-pr-diff.mts');
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
