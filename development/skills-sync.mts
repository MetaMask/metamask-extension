// Wrapper for `yarn skills`. Picks a multi-source-aware tools/sync from
// whichever skill repo is configured and delegates.
//
// Source precedence:
//   1. METAMASK_SKILLS_DIR   public MetaMask/skills clone (engineer override)
//   2. CONSENSYS_SKILLS_DIR  private Consensys/skills clone (internal overlay)
//   3. .skills-cache/metamask-skills (populated by postinstall — zero-config default)
// First match wins for the tools/sync binary; install still walks every
// configured source. Cache fallback means `yarn skills` works out of the box
// after `yarn install` without any shell rc edit.

import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const REPO = 'metamask-extension';
const CACHE_DIR = path.join(process.cwd(), '.skills-cache', 'metamask-skills');

function syncIn(dir: string): string | null {
  const candidate = path.join(dir, 'tools', 'sync');
  try {
    if (statSync(candidate).isFile()) return candidate;
  } catch {
    // ignored
  }
  return null;
}

type SyncPick = { sync: string; cacheFallback: boolean };

function pickSync(): SyncPick | null {
  for (const env of ['METAMASK_SKILLS_DIR', 'CONSENSYS_SKILLS_DIR']) {
    const dir = process.env[env];
    if (!dir) continue;
    const hit = syncIn(dir);
    if (hit) return { sync: hit, cacheFallback: false };
  }
  const cache = syncIn(CACHE_DIR);
  return cache ? { sync: cache, cacheFallback: true } : null;
}

const picked = pickSync();
if (!picked) {
  process.stderr.write(
    [
      'No skills source available.',
      '',
      'The postinstall hook normally clones the public skills repo into',
      '.skills-cache/metamask-skills automatically. If that did not happen',
      '(e.g. you ran the wrapper before `yarn install`, or postinstall was',
      'skipped via CI / SKILLS_SKIP_POSTINSTALL), point at a clone manually:',
      '',
      '  git clone https://github.com/MetaMask/skills ~/dev/metamask/skills',
      '  export METAMASK_SKILLS_DIR=~/dev/metamask/skills',
      '',
      'Optional private overlay (Consensys internal, SSH required):',
      '  git clone git@github.com:Consensys/skills.git ~/dev/Consensys/skills',
      '  export CONSENSYS_SKILLS_DIR=~/dev/Consensys/skills',
      '',
      'Then re-run `yarn skills`.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

const env = { ...process.env };
if (picked.cacheFallback && !env.METAMASK_SKILLS_DIR) {
  env.METAMASK_SKILLS_DIR = CACHE_DIR;
}

const result = spawnSync(
  'bash',
  [picked.sync, '--repo', REPO, '--target', process.cwd(), ...process.argv.slice(2)],
  { stdio: 'inherit', env },
);
process.exit(result.status === null ? 1 : result.status);
