/**
 * get-pr-diff.ts
 *
 * Fetches a unified diff for the current PR using a three-tier strategy:
 *   1. GitHub REST API (fastest — no git history needed)
 *   2. git diff against BASE_SHA from the webhook payload (immutable)
 *   3. git diff against the base branch name (original fallback)
 *
 * Environment variables (all optional, enables graceful degradation):
 *   GITHUB_REPOSITORY  — owner/repo (set automatically by GitHub Actions)
 *   BASE_SHA           — pull_request.base.sha from the event payload
 *   GH_TOKEN           — GitHub token for API access
 *
 * Requires `gh` CLI (pre-installed on GitHub Actions runners) for tier 1.
 */

import { execFileSync } from 'child_process';
import { context } from '@actions/github';

export interface GetPrDiffOptions {
  /** Base branch name (default: 'main'). Used only in the branch-based fallback. */
  baseBranch?: string;
  /** Directories to scope the git diff to (e.g. ['app/', 'ui/']). Omit for full diff. */
  directories?: string[];
  /** Maximum buffer size in bytes (default: 50 MB). */
  maxBuffer?: number;
}

/**
 * Filters a unified diff to only include hunks whose file paths start with one
 * of the given directory prefixes. Returns the full diff when dirs is empty.
 */
function filterDiffByDirectories(diff: string, dirs: string[]): string {
  if (dirs.length === 0) {
    return diff;
  }
  const normalizedDirs = dirs.map((d) => {
    const n = d.replace(/\\/g, '/');
    return n.endsWith('/') ? n : `${n}/`;
  });
  const lines = diff.split('\n');
  const result: string[] = [];
  let include = false;

  for (const line of lines) {
    // Each file section starts with "diff --git a/... b/..."
    if (line.startsWith('diff --git ')) {
      // Extract the b/ path: "diff --git a/foo/bar b/foo/bar"
      const match = / b\/(.+)$/.exec(line);
      if (match) {
        const filePath = match[1];
        include = normalizedDirs.some((dir) =>
          filePath.startsWith(dir) || filePath === dir.replace(/\/$/, ''),
        );
      } else {
        include = false;
      }
    }
    if (include) {
      result.push(line);
    }
  }
  return result.join('\n');
}

/**
 * Returns a unified diff string for the current PR.
 * Exits the process with code 1 if all strategies fail.
 */
export function getPrDiff(options: GetPrDiffOptions = {}): string {
  const {
    baseBranch = 'main',
    directories = [],
    maxBuffer = 50 * 1024 * 1024,
  } = options;

  // 1. Try GitHub API (no git history needed, fastest path)
  const prNumber = context.payload.pull_request?.number;
  const repo = process.env.GITHUB_REPOSITORY;
  if (prNumber && repo) {
    try {
      const apiDiff = execFileSync(
        'gh',
        [
          'api',
          `repos/${repo}/pulls/${prNumber}`,
          '-H',
          'Accept: application/vnd.github.diff',
        ],
        { encoding: 'utf-8', maxBuffer },
      );
      if (apiDiff.trim()) {
        console.log('Got diff from GitHub API');
        return filterDiffByDirectories(apiDiff, directories);
      }
    } catch {
      console.warn('GitHub API diff unavailable, falling back to git diff');
    }
  }

  // 2. Try git diff using the base SHA from the event payload (immutable,
  //    works even when the base branch has advanced since the event fired).
  const baseSha = process.env.BASE_SHA;
  if (baseSha) {
    try {
      execFileSync('git', ['fetch', 'origin', baseSha, '--depth=1'], {
        stdio: 'pipe',
      });
      const args = ['diff', `${baseSha}...HEAD`];
      if (directories.length > 0) {
        args.push('--', ...directories);
      }
      return execFileSync('git', args, { encoding: 'utf-8', maxBuffer });
    } catch {
      console.warn(
        `git diff with BASE_SHA (${baseSha}) failed, trying branch-based diff`,
      );
    }
  }

  // 3. Branch-based git diff (original fallback).
  //    Fetch the base branch first — in a shallow clone it won't exist locally.
  try {
    execFileSync('git', ['fetch', 'origin', baseBranch, '--depth=1'], {
      stdio: 'pipe',
    });
  } catch {
    console.warn(`Could not fetch origin/${baseBranch}`);
  }
  const diffArgs = directories.length > 0 ? ['--', ...directories] : [];
  const candidates: string[][] = [
    ['git', 'diff', `origin/${baseBranch}...HEAD`, ...diffArgs],
    ['git', 'diff', `origin/${baseBranch}..HEAD`, ...diffArgs],
    ['git', 'diff', `${baseBranch}...HEAD`, ...diffArgs],
    ['git', 'diff', `${baseBranch}..HEAD`, ...diffArgs],
  ];
  let lastError: unknown;
  for (const [cmd, ...args] of candidates) {
    try {
      return execFileSync(cmd, args, { encoding: 'utf-8', maxBuffer });
    } catch (error) {
      lastError = error;
    }
  }
  console.error(`Could not compute diff against base branch "${baseBranch}".`);
  console.error(
    'Ensure the base branch is fetched (e.g. git fetch origin <base> --depth=1).',
  );
  console.error('Last error:', lastError);
  process.exit(1);
}
