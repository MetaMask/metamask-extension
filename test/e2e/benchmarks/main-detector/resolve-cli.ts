/**
 * Usage: yarn tsx test/e2e/benchmarks/main-detector/resolve-cli.ts --head SHA --out resolve.json [--depth 40]
 * Resolves the head build and its base from main.yml push runs and CloudFront.
 * Needs a checkout with enough first-parent history and the `gh` CLI.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { resolveBuilds, type BuildRef } from './resolve';

const HOST =
  process.env.DETECTOR_BUILD_HOST ??
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension';
const REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';

const run = (command: string, args: string[]) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

const subjectOf = (sha: string) =>
  run('git', ['log', '-1', '--format=%s', sha]);

function versionOf(sha: string): string {
  const text = run('git', ['show', `${sha}:package.json`]);
  return JSON.parse(text).version;
}

async function exists(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
      if (response.status === 403 || response.status === 404) {
        return false;
      }
    } catch {
      // Retry below.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  return false;
}

// main.yml posts these two statuses on every commit it builds. builds-from-run
// names the run that holds the zips, which is a donor run when builds were reused.
function statusesOf(sha: string): Record<string, string> {
  const text = run('gh', [
    'api',
    `repos/${REPOSITORY}/commits/${sha}/status?per_page=100`,
    '--jq',
    '[.statuses[] | select(.context == "build-source-hash" or .context == "builds-from-run") | {(.context): .description}] | add // {}',
  ]);
  return JSON.parse(text || '{}');
}

async function lookup(sha: string): Promise<BuildRef | undefined> {
  const version = versionOf(sha);
  const statuses = statusesOf(sha);
  const sourceHash = statuses['build-source-hash'];
  const reuse = statuses['builds-from-run'];
  // Without the status (best-effort on main.yml's side), fall back to the
  // commit's own push runs.
  const candidates = reuse
    ? [reuse]
    : run('gh', [
        'api',
        `repos/${REPOSITORY}/actions/workflows/main.yml/runs?head_sha=${sha}&event=push&per_page=20`,
        '--jq',
        '.workflow_runs | sort_by(.created_at) | reverse | .[].id',
      ])
        .split('\n')
        .filter(Boolean);
  for (const id of candidates) {
    const chrome = `${HOST}/${id}/build-test-webpack/builds/metamask-chrome-${version}.zip`;
    const firefox = `${HOST}/${id}/build-test-mv2-webpack/builds/metamask-firefox-${version}.zip`;
    const [hasChrome, hasFirefox] = await Promise.all([
      exists(chrome),
      exists(firefox),
    ]);
    if (hasChrome && hasFirefox) {
      return { sha, run: id, version, sourceHash };
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('head', { type: 'string', default: 'HEAD' })
    .option('depth', { type: 'number', default: 40 })
    .option('out', { type: 'string', demandOption: true })
    .parseAsync();

  const commits = run('git', [
    'log',
    '--first-parent',
    '--format=%H',
    `-n${argv.depth}`,
    argv.head,
  ]).split('\n');
  const result = await resolveBuilds(commits, lookup);
  const subjects = Object.fromEntries(
    ('range' in result ? result.range : [commits[0]]).map((sha) => [
      sha,
      subjectOf(sha),
    ]),
  );
  fs.writeFileSync(
    argv.out,
    JSON.stringify({ ...result, headSha: commits[0], subjects }, null, 2),
  );
  console.log(JSON.stringify({ ...result, subjects }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
