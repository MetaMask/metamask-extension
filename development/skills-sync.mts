// Wrapper for `yarn skills`. Picks a multi-source-aware tools/sync from
// whichever skill repo is configured and delegates.
//
// Source configuration comes from env vars first, then .skills.local.
// Prefer the public MetaMask/skills sync CLI whenever it is available:
//   1. METAMASK_SKILLS_DIR/tools/sync
//   2. .skills-cache/metamask-skills/tools/sync (zero-config default)
//   3. CONSENSYS_SKILLS_DIR/tools/sync (private fallback when no public source exists)
// The public sync still walks every configured source. Cache fallback means
// `yarn skills` works out of the box after `yarn install` without any shell rc
// edit.

import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';

const REPO = 'metamask-extension';
const CACHE_DIR = path.join(process.cwd(), '.skills-cache', 'metamask-skills');
const CONFIG_FILE = path.join(process.cwd(), '.skills.local');
const SOURCE_ENV_KEYS = [
  'METAMASK_SKILLS_DIR',
  'CONSENSYS_SKILLS_DIR',
] as const;

function syncIn(dir: string): string | null {
  const candidate = path.join(dir, 'tools', 'sync');
  try {
    if (statSync(candidate).isFile()) return candidate;
  } catch {
    // ignored
  }
  return null;
}

function bashMajorVersion(candidate: string): number | null {
  const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
  if (result.status !== 0) return null;

  const match = `${result.stdout}${result.stderr}`.match(
    /GNU bash, version (\d+)\./u,
  );
  return match ? Number(match[1]) : null;
}

function pickBash(): string | null {
  const candidates = [
    process.env.BASH,
    'bash',
    '/opt/homebrew/bin/bash',
    '/usr/local/bin/bash',
    '/bin/bash',
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of new Set(candidates)) {
    const major = bashMajorVersion(candidate);
    if (major && major >= 4) {
      return candidate;
    }
  }

  return null;
}

type SkillSourceEnv = Record<
  (typeof SOURCE_ENV_KEYS)[number],
  string | undefined
>;
type SyncPick = { sync: string };

function loadSkillSourceEnv(): SkillSourceEnv {
  const env: SkillSourceEnv = {
    METAMASK_SKILLS_DIR: process.env.METAMASK_SKILLS_DIR,
    CONSENSYS_SKILLS_DIR: process.env.CONSENSYS_SKILLS_DIR,
  };

  try {
    const localConfig = parse(readFileSync(CONFIG_FILE, 'utf8'));
    for (const key of SOURCE_ENV_KEYS) {
      if (!env[key]) {
        env[key] = localConfig[key];
      }
    }
  } catch {
    // ignored: .skills.local is optional
  }

  return env;
}

function pickSync(sourceEnv: SkillSourceEnv): SyncPick | null {
  const publicSync = sourceEnv.METAMASK_SKILLS_DIR
    ? syncIn(sourceEnv.METAMASK_SKILLS_DIR)
    : null;
  if (publicSync) {
    return { sync: publicSync };
  }

  const cacheSync = syncIn(CACHE_DIR);
  if (cacheSync) {
    return { sync: cacheSync };
  }

  if (sourceEnv.CONSENSYS_SKILLS_DIR) {
    const privateSync = syncIn(sourceEnv.CONSENSYS_SKILLS_DIR);
    if (privateSync) {
      return { sync: privateSync };
    }
  }

  return null;
}

const sourceEnv = loadSkillSourceEnv();
const picked = pickSync(sourceEnv);
if (!picked) {
  process.stderr.write(
    [
      'No skills source available.',
      '',
      'The postinstall hook normally clones the public skills repo into',
      '.skills-cache/metamask-skills automatically. If that did not happen',
      '(e.g. you ran the wrapper before `yarn install`, or postinstall was',
      'skipped via CI / SKILLS_SKIP_POSTINSTALL), point at a clone manually',
      'in .skills.local or via shell env:',
      '',
      '  git clone https://github.com/MetaMask/skills ~/dev/metamask/skills',
      '  echo METAMASK_SKILLS_DIR=~/dev/metamask/skills >> .skills.local',
      '',
      'Optional private overlay (Consensys internal, SSH required):',
      '  git clone git@github.com:Consensys/skills.git ~/dev/Consensys/skills',
      '  echo CONSENSYS_SKILLS_DIR=~/dev/Consensys/skills >> .skills.local',
      '',
      'Then re-run `yarn skills`.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

const env = { ...process.env };
for (const key of SOURCE_ENV_KEYS) {
  if (!env[key] && sourceEnv[key]) {
    env[key] = sourceEnv[key];
  }
}
if (!env.METAMASK_SKILLS_DIR && syncIn(CACHE_DIR)) {
  env.METAMASK_SKILLS_DIR = CACHE_DIR;
}

const bash = pickBash();
if (!bash) {
  process.stderr.write(
    [
      'No supported Bash found.',
      '',
      '`yarn skills` requires Bash 4+ because the shared skills installer uses',
      'modern Bash features. macOS /bin/bash is 3.2.',
      '',
      'Install a current Bash, then re-run `yarn skills`:',
      '  brew install bash',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
if (bash.includes(path.sep)) {
  env.PATH = `${path.dirname(bash)}${path.delimiter}${env.PATH ?? ''}`;
}

const result = spawnSync(
  bash,
  [
    picked.sync,
    '--repo',
    REPO,
    '--target',
    process.cwd(),
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit', env },
);
process.exit(result.status === null ? 1 : result.status);
