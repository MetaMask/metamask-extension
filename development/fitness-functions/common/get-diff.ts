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

  const [path] = process.argv.slice(3);
  if (path) {
    return fs.readFileSync(path, {
      encoding: 'utf8',
      flag: 'r',
    });
  }

  if (automationType === AUTOMATION_TYPE.CI) {
    // For non-PR triggers (e.g. `merge_queue` or `push` to protected branch)
    // we can assume we're dealing with a single squashed commit.
    return await getCommitDiff();
  } else if (automationType === AUTOMATION_TYPE.PR) {
    // Fetch diff directly (requires CI environment variables).
    // Lazy dynamic import to avoid pulling @actions/github into local dev hooks
    // (and because @actions/github is now ESM-only).
    const { getPrDiff } =
      await import('../../../.github/scripts/shared/get-pr-diff.mts');
    return await getPrDiff({ baseBranch: process.env.BASE_REF || 'main' });
  } else if (automationType === AUTOMATION_TYPE.PRE_COMMIT_HOOK) {
    return await getPreCommitHookDiff();
  } else if (automationType === AUTOMATION_TYPE.PRE_PUSH_HOOK) {
    return await getPrePushHookDiff();
  }

  // Check that all types were handled
  automationType satisfies never;
}

function runGitCommand(args: string[]): string {
  return execFileSync('git', args, GIT_EXEC_FILE_OPTIONS).trim();
}

/**
 * Get the diff for the HEAD commit.
 *
 * @returns The diff for the HEAD commit
 */
async function getCommitDiff(): Promise<string> {
  return runGitCommand(['diff', 'HEAD^', 'HEAD']);
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
