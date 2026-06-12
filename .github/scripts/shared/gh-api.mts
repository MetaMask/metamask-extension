/**
 * gh-api.mts
 *
 * Thin wrapper around `gh api` for GitHub REST API calls.
 * Uses the `gh` CLI — pre-installed on every GitHub Actions runner,
 * zero npm dependencies required.
 *
 * Auth: reads GH_TOKEN from the environment (set by the caller or
 * by passing `token` from getGitHubToken()).
 */

import { execFileSync } from 'node:child_process';

export interface GhApiOptions {
  paginate?: boolean;
  jq?: string;
  method?: string;
  body?: Record<string, unknown>;
}

/**
 * Call a GitHub REST API endpoint via `gh api`.
 *
 * @param path  - API path, e.g. `/repos/owner/repo/issues`
 * @param opts  - Optional: paginate, jq filter, HTTP method, JSON body
 * @param token - GitHub token (defaults to GH_TOKEN / GITHUB_TOKEN env)
 */
export function ghApi(
  path: string,
  opts?: GhApiOptions,
  token?: string,
): string {
  const args = ['api', path];
  if (opts?.paginate) args.push('--paginate');
  if (opts?.jq) args.push('--jq', opts.jq);
  if (opts?.method) args.push('--method', opts.method);
  if (opts?.body) args.push('--input', '-');
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env;
  return execFileSync('gh', args, {
    encoding: 'utf8',
    ...(opts?.body ? { input: JSON.stringify(opts.body) } : {}),
    maxBuffer: 10 * 1024 * 1024,
    env,
  });
}
