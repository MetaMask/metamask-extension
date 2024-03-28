import { execSync } from 'node:child_process';
import { join } from 'node:path';

type Commit = {
  hash: () => string;
  timestamp: () => number;
};

/**
 * Cache variable to store the most recent commit information. This is used to
 * avoid repeated calls to the git command for performance optimization.
 */
let cache: Map<string, Commit> = new Map();

/**
 * Retrieves the most recent Git commit information, including its short hash and timestamp.
 * If the information is cached, the cached value is returned to improve performance. Otherwise,
 * it executes a git command to retrieve the latest commit's hash and timestamp, caches it, and
 * then returns the information.
 *
 * @returns The latest commit's hash and timestamp.
 */
export function getLatestCommit(
  gitDir: string = join(__dirname, '../../../.git'),
): Commit {
  let cached = cache.get(gitDir);
  if (cached) return cached;

  // execute the `git` command to get the latest commit's 8 character hash
  // (`%h` and `--abbrev=8`) and authorship timestamp (seconds since the Unix
  // epoch)
  const hashLength = 8;
  const log = execSync(`git log -1 --format='%h%at' --abbrev=${hashLength}`);
  const response = {
    hash() {
      return log.toString('utf8', 0, hashLength);
    },
    timestamp() {
      // convert to milliseconds
      return Number(log.toString('utf8', hashLength)) * 1000;
    },
  };
  cache.set(gitDir, response);
  return response;
}
