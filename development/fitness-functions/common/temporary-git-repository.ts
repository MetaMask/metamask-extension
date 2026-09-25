import { execFileSync } from 'child_process';
import fs from 'fs';
import * as path from 'path';
import { createSandbox } from '@metamask/utils/node';

/**
 * Helpers for manipulating the temporary Git repository that
 * {@link withinTemporaryGitRepository} creates.
 */
type TemporaryGitRepositoryHelpers = {
  /**
   * Writes a file in the working tree of the repository.
   */
  writeFile: (filePath: string, contents: string) => void;
  /**
   * Commits every change in the working tree of the repository, returning the
   * SHA of the new commit.
   */
  commitAllFiles: () => string;
  /**
   * Simulates a change to a file: commits the file with its base contents,
   * then writes its current contents to the working tree without committing
   * them. Returns the SHA of the commit containing the base contents.
   */
  createFileWithChanges: (options: {
    filePath: string;
    baseContents: string;
    currentContents: string;
  }) => string;
};

/**
 * Runs a function inside a new Git repository in a temporary directory.
 *
 * Fitness functions that compare files across a change read the working tree
 * and the base commit relative to the current working directory, just as they
 * do in CI. Tests use this to exercise that same code against real Git history
 * instead of injecting file contents.
 *
 * The repository is made the current working directory while the function
 * runs; afterward, the previous working directory is restored and the
 * repository is removed, even if the function throws. The returned promise
 * must be awaited, as the function does not run synchronously.
 *
 * @param callback - The function to run.
 */
export async function withinTemporaryGitRepository(
  callback: (helpers: TemporaryGitRepositoryHelpers) => void | Promise<void>,
): Promise<void> {
  const { withinSandbox } = createSandbox('fitness-functions');

  await withinSandbox(async ({ directoryPath }) => {
    const originalWorkingDirectoryPath = process.cwd();
    process.chdir(directoryPath);

    try {
      runGit(['init', '--quiet']);
      await callback({ writeFile, commitAllFiles, createFileWithChanges });
    } finally {
      process.chdir(originalWorkingDirectoryPath);
    }
  });
}

/**
 * Writes a file in the working tree of the current repository, creating any
 * directories leading up to it.
 *
 * Tests use this to set up the files that fitness functions read, either
 * before committing them (to form the base commit) or afterward (to form the
 * working tree).
 *
 * @param filePath - The repository-relative path of the file.
 * @param contents - The contents of the file.
 */
function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

/**
 * Commits every change in the working tree of the current repository.
 *
 * Tests use the returned SHA as the base commit that fitness functions compare
 * the working tree against. Signing and hooks are disabled so that commits
 * succeed regardless of the developer's Git configuration, and empty commits
 * are allowed so that a base commit can be created before any files exist.
 *
 * @returns The SHA of the new commit.
 */
function commitAllFiles(): string {
  runGit(['add', '--all']);
  runGit([
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.com',
    '-c',
    'commit.gpgsign=false',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '--quiet',
    '--allow-empty',
    '--message',
    'Commit',
  ]);
  return runGit(['rev-parse', 'HEAD']);
}

/**
 * Simulates a change to a file in the current repository.
 *
 * This mirrors the situation in CI, where the base commit contains the file
 * before the PR and the working tree contains the file after the PR. Most
 * tests only need this single change, so this saves them from writing,
 * committing, and writing again.
 *
 * @param options - The options.
 * @param options.filePath - The repository-relative path of the file.
 * @param options.baseContents - The contents of the file at the base commit.
 * @param options.currentContents - The contents of the file in the working
 * tree.
 * @returns The SHA of the commit containing the base contents.
 */
function createFileWithChanges({
  filePath,
  baseContents,
  currentContents,
}: {
  filePath: string;
  baseContents: string;
  currentContents: string;
}): string {
  writeFile(filePath, baseContents);
  const baseCommitSha = commitAllFiles();
  writeFile(filePath, currentContents);
  return baseCommitSha;
}

/**
 * Runs a Git command in the current working directory.
 *
 * This is used to initialize the temporary repository and to create commits
 * within it.
 *
 * @param args - The arguments to pass to Git.
 * @returns The trimmed standard output of the command.
 */
function runGit(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
