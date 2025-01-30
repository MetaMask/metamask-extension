import { spawnSync } from 'node:child_process';
import { join, normalize } from 'node:path';

type Commit = {
  hash: () => string;
  timestamp: () => number;
};

/**
 * Cache variable to store the most recent commit information. This is used to
 * avoid repeated calls to the git command for performance optimization.
 */
const cache: Map<string, Commit> = new Map();

/**
 * Retrieves the most recent Git commit information, including its short hash
 * and timestamp. If the information is cached, the cached value is returned to
 * improve performance. Otherwise, it executes a git command to retrieve the
 * latest commit's hash and timestamp, caches it, and then returns the
 * information.
 *
 * @param gitDir
 * @returns The latest commit's hash and timestamp.
 */
export function getLatestCommit(
  gitDir: string = join(__dirname, '../../../.git'),
): Commit {
  const cached = cache.get(gitDir);
  if (cached) return cached;

  // execute the `git` command to get the latest commit's 8 character hash
  // (`%h` and `--abbrev=8`) and authorship timestamp (seconds since the Unix
  // epoch)
  const hashLength = 8;
  const args = [
    `--git-dir`,
    normalize(gitDir),
    'log',
    '-1',
    '--format=%h%at',
    `--abbrev=${hashLength}`,
  ] as const;
  const { stdout } = spawnSync('git', args, {
    encoding: 'buffer',
    env: process.env,
    maxBuffer: 256, // we really only need like 19 bytes
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const response = {
    hash() {
      return stdout.toString('utf8', 0, hashLength);
    },
    timestamp() {
      // convert to milliseconds
      return Number(stdout.toString('utf8', hashLength)) * 1000;
    },
  };
  cache.set(gitDir, response);
  return response;
}
