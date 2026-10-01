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

/**
 * Gets the diff that fitness functions should check, along with the commit
 * that it is based on.
 *
 * @param automationType - The context in which the fitness functions are
 * running (CI, pre-commit hook, or pre-push hook).
 * @param diffPath - A file that contains a diff, used to override the CI logic.
 * @returns The diff and the commit it is based on. In CI, this is the PR's
 * base commit (`BASE_SHA`).
 */
async function getDiffByAutomationType(
  automationType: AUTOMATION_TYPE,
  diffPath?: string,
): Promise<{ baseRef: string; diff: string }> {
  if (automationType === AUTOMATION_TYPE.CI) {
    return await getCIDiff(diffPath);
  }

  if (automationType === AUTOMATION_TYPE.PRE_COMMIT_HOOK) {
    return getPreCommitHookDiff();
  }

  return getPrePushHookDiff();
}

/**
 * Gets the diff for the current PR, along with the PR's base commit.
 *
 * @param path - A file to read the diff from, instead of fetching it for the
 * current PR. The diff is assumed to be relative to `BASE_SHA`.
 * @returns The diff and the PR's base commit.
 */
async function getCIDiff(
  path?: string,
): Promise<{ baseRef: string; diff: string }> {
  // There are some fitness functions that rely on checking out a file from the
  // base branch of the current PR, so we need a usable ref.
  //
  // Although we are passing `BASE_REF` to `getPrDiff` below, we can't use this,
  // because the workflow where `fitness-functions` runs does not check it out.
  // Fortunately, the workflow *does* check out `BASE_SHA`.
  //
  // Note that if the `fitness-functions` is run manually, then `BASE_SHA` will
  // need to be provided (we can't just assume `main`).
  const baseSha = process.env.BASE_SHA;
  if (!baseSha) {
    throw new Error('BASE_SHA must be set when running in CI');
  }

  if (path) {
    const diff = fs.readFileSync(path, {
      encoding: 'utf8',
      flag: 'r',
    });
    return { baseRef: baseSha, diff };
  }

  // No file argument — fetch diff directly (requires CI environment variables).
  // Lazy dynamic import to avoid pulling @actions/github into local dev hooks
  // (and because @actions/github is now ESM-only).
  const { getPrDiff } =
    await import('../../../.github/scripts/shared/get-pr-diff.mts');
  const diff = getPrDiff({
    baseSha,
    baseBranch: process.env.BASE_REF || 'main',
  });
  return { baseRef: baseSha, diff };
}

function runGitCommand(args: string[]): string {
  return execFileSync('git', args, GIT_EXEC_FILE_OPTIONS).trim();
}

function getPreCommitHookDiff(): { diff: string; baseRef: string } {
  const baseRef = 'HEAD';
  const diff = runGitCommand(['diff', '--cached', baseRef]);
  return { baseRef, diff };
}

function getPrePushHookDiff(): { baseRef: string; diff: string } {
  const currentBranch = runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD']);

  const diff = runGitCommand([
    'diff',
    currentBranch,
    `origin/${currentBranch}`,
    '--',
    '.',
    ':(exclude)development/fitness-functions/',
  ]);

  return { baseRef: currentBranch, diff };
}

export { getDiffByAutomationType };
