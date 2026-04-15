/**
 * github-token.mts
 *
 * Resolves a GitHub token from (in order):
 *   1. GITHUB_TOKEN env var
 *   2. GH_TOKEN env var
 *   3. `gh auth token` CLI output
 *
 * Exits with an error if none are available.
 */

import { execFileSync } from 'node:child_process';

export function getGitHubToken(): string {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  if (fromEnv) return fromEnv;

  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    // gh CLI not authenticated or not installed
  }

  console.error(
    'No GitHub token found. Set GITHUB_TOKEN or GH_TOKEN, or run `gh auth login`.',
  );
  process.exit(1);
}
