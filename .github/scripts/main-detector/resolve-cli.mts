/**
 * Usage: node .github/scripts/main-detector/resolve-cli.mts --head SHA --out resolve.json [--depth 40]
 * Resolves the head build and its base from main.yml push runs and CloudFront.
 * Needs a checkout with enough first-parent history and the `gh` CLI.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { REPOSITORY, buildZipUrl } from './build-source.mts';
import { parseStatusLines, resolveBuilds, type BuildRef } from './resolve.mts';

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
  let lastError = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
      if (response.status === 403 || response.status === 404) {
        return false;
      }
      lastError = `${url} returned ${response.status}`;
    } catch (error) {
      lastError = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  // A transient failure must not read as "no build", which would move the base back.
  throw new Error(`Could not check ${url}: ${lastError}`);
}

// main.yml posts these two statuses on every commit it builds. builds-from-run
// names the run that holds the zips, which is a donor run when builds were reused.
function statusesOf(sha: string): Record<string, string> {
  const text = run('gh', [
    'api',
    '--paginate',
    `repos/${REPOSITORY}/commits/${sha}/statuses?per_page=100`,
    '--jq',
    '.[] | select(.context == "build-source-hash" or .context == "builds-from-run") | [.context, .description] | @tsv',
  ]);
  return parseStatusLines(text);
}

async function lookup(sha: string): Promise<BuildRef | undefined> {
  const version = versionOf(sha);
  const statuses = statusesOf(sha);
  const sourceHash = statuses['build-source-hash'];
  const reuse = statuses['builds-from-run'];
  if (reuse !== undefined && !/^\d+$/u.test(reuse)) {
    throw new Error(`Invalid builds-from-run status on ${sha}: ${reuse}`);
  }
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
    const [hasChrome, hasFirefox] = await Promise.all([
      exists(buildZipUrl('chrome', id, version)),
      exists(buildZipUrl('firefox', id, version)),
    ]);
    if (hasChrome && hasFirefox) {
      return { sha, run: id, version, sourceHash };
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      head: { type: 'string', default: 'HEAD' },
      depth: { type: 'string', default: '40' },
      out: { type: 'string' },
    },
  });
  if (!values.out) {
    throw new Error('--out is required');
  }

  const commits = run('git', [
    'log',
    '--first-parent',
    '--format=%H',
    `-n${values.depth}`,
    values.head,
  ]).split('\n');
  const result = await resolveBuilds(commits, lookup);
  const subjects = Object.fromEntries(
    ('range' in result ? result.range : [commits[0]]).map((sha) => [
      sha,
      subjectOf(sha),
    ]),
  );
  fs.writeFileSync(
    values.out,
    JSON.stringify({ ...result, headSha: commits[0], subjects }, null, 2),
  );
  console.log(JSON.stringify({ ...result, subjects }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
