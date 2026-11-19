import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type * as actionsCore from '@actions/core';
import type * as actionsGithub from '@actions/github';
import type { GitHub as GitHubValue } from '@actions/github/lib/utils';
import { getGitHubToken } from './github-token.mts';

export type GitHub = InstanceType<typeof GitHubValue>;

export type Context = typeof actionsGithub.context;

export type Core = typeof actionsCore;

export type GitHubOptions = {
  github: GitHub;
  context: Context;
  core: Core;
};

/**
 * Builds the options bag for running a script directly with `node`.
 *
 * These are the real `@actions` implementations, not stand-ins. `@actions/github` constructs
 * its `Context` at module load from `GITHUB_*` environment variables, so this populates the
 * environment first and imports afterwards — meaning a local run gets the same object shape,
 * getters and quirks that CI does.
 *
 * @param options - Overrides for the simulated environment.
 * @param options.token - Token for the GitHub client. Defaults to `getGitHubToken()`, which
 * falls back through GITHUB_TOKEN, GH_TOKEN, then `gh auth token`.
 * @param options.repository - `owner/repo` backing `context.repo`.
 * @param options.payload - Extra webhook payload fields, merged over the generated
 * `repository`. Typed as the real `WebhookPayload`, so e.g. a `pull_request` needs its
 * `number` here just as it would on a runner.
 * @returns The `{ github, context, core }` options bag.
 */
export async function createGitHubOptions({
  token = getGitHubToken(),
  repository = process.env.GITHUB_REPOSITORY || 'MetaMask/metamask-extension',
  payload = {},
}: {
  token?: string;
  repository?: string;
  payload?: Context['payload'];
} = {}): Promise<GitHubOptions> {
  process.env.GITHUB_REPOSITORY = repository;
  const [owner = '', repo = ''] = repository.split('/');

  // `PayloadRepository` requires `name` and `owner.login`, so build a valid one here rather
  // than making every caller repeat it. Caller-supplied fields win.
  const eventPayload: Context['payload'] = {
    ...payload,
    repository: {
      name: repo,
      owner: { login: owner },
      default_branch: process.env.DEFAULT_BRANCH || 'main',
      ...payload.repository,
    },
  };

  // `Context` reads GITHUB_EVENT_PATH and JSON-parses it into `context.payload`, so the
  // payload has to reach it as a real file. An existing GITHUB_EVENT_PATH wins, so this can
  // also run against a genuine event dump.
  if (!process.env.GITHUB_EVENT_PATH) {
    const directory = await mkdtemp(join(tmpdir(), 'github-options-'));
    const eventPath = join(directory, 'event.json');
    await writeFile(eventPath, JSON.stringify(eventPayload));
    process.env.GITHUB_EVENT_PATH = eventPath;
  }

  // Imported only now: `context` is built when @actions/github is first loaded.
  const [core, { context, getOctokit }] = await Promise.all([
    import('@actions/core'),
    import('@actions/github'),
  ]);

  return { github: getOctokit(token), context, core };
}
