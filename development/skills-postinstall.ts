// Auto-update skills on `yarn install`. Best-effort: never fails the install.
//
// - Skipped on CI, or when SKILLS_SKIP_POSTINSTALL=1.
// - Override CI skip with SKILLS_FORCE_POSTINSTALL=1 (for CI jobs that
//   actually need skills installed, e.g. agent-driven review bots).
// - Clones https://github.com/MetaMask/skills (public, no auth) into
//   .skills-cache/metamask-skills if absent.
// - `git fetch + reset` to origin/main if present.
// - Leaves installation/domain selection to `yarn skills`, which reads
//   .skills.local and SKILLS_DOMAINS.
// - All errors swallowed with a one-line warning. Engineers can run
//   `yarn skills` manually for interactive feedback.

import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import path from 'node:path';

const CACHE_DIR = '.skills-cache/metamask-skills';
const PUBLIC_REPO = 'https://github.com/MetaMask/skills.git';

type SpawnSync = typeof spawnSync;
type StatSync = typeof statSync;
type MkdirSync = typeof mkdirSync;
type Stderr = Pick<NodeJS.WriteStream, 'write'>;

type PostinstallDeps = {
  env?: NodeJS.ProcessEnv;
  mkdir?: MkdirSync;
  spawn?: SpawnSync;
  stat?: StatSync;
  stderr?: Stderr;
};

export function warn(msg: string, stderr?: Stderr): void {
  const writer = stderr ?? process.stderr;
  writer.write(
    `skills postinstall: ${msg} (run \`yarn skills\` for details)\n`,
  );
}

export function run(
  cmd: string,
  args: string[],
  spawn?: SpawnSync,
): SpawnSyncReturns<Buffer> {
  const spawnFn = spawn ?? spawnSync;
  return spawnFn(cmd, args, { stdio: 'ignore' }) as SpawnSyncReturns<Buffer>;
}

export function isGitDir(dir: string, stat?: StatSync): boolean {
  const statFn = stat ?? statSync;
  try {
    return statFn(path.join(dir, '.git')).isDirectory();
  } catch {
    return false;
  }
}

export function shouldSkipPostinstall(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    env.SKILLS_SKIP_POSTINSTALL || (env.CI && !env.SKILLS_FORCE_POSTINSTALL),
  );
}

export function postinstall(deps?: PostinstallDeps): number {
  const env = deps?.env ?? process.env;
  const mkdir = deps?.mkdir ?? mkdirSync;
  const spawn = deps?.spawn ?? spawnSync;
  const stat = deps?.stat ?? statSync;
  const stderr = deps?.stderr ?? process.stderr;

  if (shouldSkipPostinstall(env)) {
    return 0;
  }

  try {
    const hasCache = isGitDir(CACHE_DIR, stat);
    if (hasCache) {
      const fetchResult = run(
        'git',
        ['-C', CACHE_DIR, 'fetch', '--depth', '1', 'origin', 'main'],
        spawn,
      );
      if (fetchResult.status !== 0) {
        warn('fetch failed (offline?)', stderr);
        return 0;
      }
      const reset = run(
        'git',
        ['-C', CACHE_DIR, 'reset', '--hard', 'origin/main'],
        spawn,
      );
      if (reset.status !== 0) {
        warn('reset failed', stderr);
        return 0;
      }
    } else {
      mkdir(path.dirname(CACHE_DIR), { recursive: true });
      const clone = run(
        'git',
        ['clone', '--depth', '1', '--branch', 'main', PUBLIC_REPO, CACHE_DIR],
        spawn,
      );
      if (clone.status !== 0) {
        warn('clone failed (offline?)', stderr);
        return 0;
      }
    }

    // `yarn skills` performs installation with the selected Bash and honors
    // .skills.local / SKILLS_DOMAINS. Postinstall only keeps the public cache
    // available so that default path works without any local configuration.
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warn(`unexpected error: ${msg}`, stderr);
  }

  return 0;
}

/* istanbul ignore next */
if (process.argv[1]?.endsWith(`${path.sep}skills-postinstall.ts`)) {
  process.exit(postinstall());
}
