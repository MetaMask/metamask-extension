// Refresh the public skills cache on `yarn install`. Best-effort: never fails the install.
//
// - Skipped on CI, or when SKILLS_SKIP_POSTINSTALL=1.
// - Override CI skip with SKILLS_FORCE_POSTINSTALL=1 (for CI jobs that
//   actually need skills installed, e.g. agent-driven review bots).
// - Clones https://github.com/MetaMask/skills (public, no auth) into
//   .skills-cache/metamask-skills if absent.
// - `git fetch + reset` to origin/main if present.
// - When SKILLS_AUTO_UPDATE=1, also runs `yarn skills` after the cache
//   refresh so generated skills stay current. Off by default for backward
//   compatibility.
// - Leaves installation/domain selection to `yarn skills`, which reads
//   .skills.local and SKILLS_DOMAINS.
// - Failures are reported with a one-line warning. Engineers can run
//   `yarn skills` manually for interactive feedback.

import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const CACHE_DIR = '.skills-cache/metamask-skills';
const PUBLIC_REPO = 'https://github.com/MetaMask/skills.git';

type SpawnSync = typeof spawnSync;
type StatSync = typeof statSync;
type MkdirSync = typeof mkdirSync;
type Stderr = Pick<NodeJS.WriteStream, 'write'>;
type ReadFileSync = typeof readFileSync;

type PostinstallDeps = {
  env?: NodeJS.ProcessEnv;
  mkdir?: MkdirSync;
  spawn?: SpawnSync;
  stat?: StatSync;
  stderr?: Stderr;
  readFile?: ReadFileSync;
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
  stdio: 'ignore' | 'inherit' = 'ignore',
): SpawnSyncReturns<Buffer> {
  const spawnFn = spawn ?? spawnSync;
  return spawnFn(cmd, args, { stdio }) as SpawnSyncReturns<Buffer>;
}

export function isGitDir(dir: string, stat?: StatSync): boolean {
  const statFn = stat ?? statSync;
  try {
    return statFn(path.join(dir, '.git')).isDirectory();
  } catch {
    return false;
  }
}

export function isTruthy(value: string | undefined): boolean {
  return /^(1|true|yes)$/iu.test(value ?? '');
}

export function shouldSkipPostinstall(env: NodeJS.ProcessEnv): boolean {
  return (
    isTruthy(env.SKILLS_SKIP_POSTINSTALL) ||
    (isTruthy(env.CI) && !isTruthy(env.SKILLS_FORCE_POSTINSTALL))
  );
}

export function parseSkillsLocal(content: string): Record<string, string> {
  const config: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/u, '').trim();
    }
    config[key] = value;
  }

  return config;
}

export function readSkillsLocal(
  readFile?: ReadFileSync,
): Record<string, string> {
  const read = readFile ?? readFileSync;
  try {
    return parseSkillsLocal(read('.skills.local', 'utf8') as string);
  } catch {
    return {};
  }
}

export function getConfigValue(
  env: NodeJS.ProcessEnv,
  key: string,
  readFile?: ReadFileSync,
): string | undefined {
  // A shell/CI value intentionally wins even when empty, so developers can
  // override a persistent .skills.local opt-in for one install.
  if (Object.prototype.hasOwnProperty.call(env, key)) {
    return env[key];
  }
  return readSkillsLocal(readFile)[key];
}

export function shouldAutoUpdateSkills(
  env: NodeJS.ProcessEnv,
  readFile?: ReadFileSync,
): boolean {
  return isTruthy(getConfigValue(env, 'SKILLS_AUTO_UPDATE', readFile));
}

export function ensurePublicSkillsCache(deps?: PostinstallDeps): boolean {
  const mkdir = deps?.mkdir ?? mkdirSync;
  const spawn = deps?.spawn ?? spawnSync;
  const stat = deps?.stat ?? statSync;
  const stderr = deps?.stderr ?? process.stderr;

  const hasCache = isGitDir(CACHE_DIR, stat);
  if (hasCache) {
    const fetchResult = run(
      'git',
      ['-C', CACHE_DIR, 'fetch', '--depth', '1', 'origin', 'main'],
      spawn,
    );
    if (fetchResult.status !== 0) {
      warn('fetch failed (offline?)', stderr);
      return false;
    }
    const reset = run(
      'git',
      ['-C', CACHE_DIR, 'reset', '--hard', 'origin/main'],
      spawn,
    );
    if (reset.status !== 0) {
      warn('reset failed', stderr);
      return false;
    }
    return true;
  }

  mkdir(path.dirname(CACHE_DIR), { recursive: true });
  const clone = run(
    'git',
    ['clone', '--depth', '1', '--branch', 'main', PUBLIC_REPO, CACHE_DIR],
    spawn,
  );
  if (clone.status !== 0) {
    warn('clone failed (offline?)', stderr);
    return false;
  }
  return true;
}

export function autoUpdateSkills(deps?: PostinstallDeps): boolean {
  const spawn = deps?.spawn ?? spawnSync;
  const stderr = deps?.stderr ?? process.stderr;

  const sync = run('yarn', ['skills'], spawn, 'inherit');
  if (sync.status !== 0) {
    warn('skills sync failed', stderr);
    return false;
  }
  return true;
}

export function postinstall(deps?: PostinstallDeps): number {
  const env = deps?.env ?? process.env;
  const stderr = deps?.stderr ?? process.stderr;

  if (shouldSkipPostinstall(env)) {
    return 0;
  }

  try {
    const cacheReady = ensurePublicSkillsCache(deps);

    // `yarn skills` performs installation with the selected Bash and honors
    // .skills.local / SKILLS_DOMAINS. Postinstall only runs it when explicitly
    // opted in so existing installs keep their current behavior.
    if (shouldAutoUpdateSkills(env, deps?.readFile)) {
      if (
        cacheReady ||
        getConfigValue(env, 'METAMASK_SKILLS_DIR', deps?.readFile) ||
        getConfigValue(env, 'CONSENSYS_SKILLS_DIR', deps?.readFile)
      ) {
        autoUpdateSkills(deps);
      } else {
        warn('auto-update skipped because skills cache is unavailable', stderr);
      }
    }
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
