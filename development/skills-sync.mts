// Wrapper for `yarn skills`. Picks a multi-source-aware tools/sync from
// whichever skill repo is configured and delegates.
//
// Source precedence:
//   - METAMASK_SKILLS_DIR   public MetaMask/skills clone (no auth)
//   - CONSENSYS_SKILLS_DIR  private Consensys/skills clone (optional overlay)
// Public is preferred when present (the multi-source tooling lives there);
// private is the fallback when only the private checkout is configured.

import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const REPO = 'metamask-extension';

function pickSync(): string | null {
  for (const env of ['METAMASK_SKILLS_DIR', 'CONSENSYS_SKILLS_DIR']) {
    const dir = process.env[env];
    if (!dir) continue;
    const candidate = path.join(dir, 'tools', 'sync');
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // ignored
    }
  }
  return null;
}

const sync = pickSync();
if (!sync) {
  process.stderr.write(
    [
      'No skills source configured. Set at least one of:',
      '',
      '  METAMASK_SKILLS_DIR   public MetaMask/skills checkout (no auth)',
      '  CONSENSYS_SKILLS_DIR  private Consensys/skills checkout (internal overlay)',
      '',
      'Quickstart (public, recommended):',
      '  git clone https://github.com/MetaMask/skills ~/dev/metamask/skills',
      '  export METAMASK_SKILLS_DIR=~/dev/metamask/skills',
      '',
      'For private overlays (Consensys internal):',
      '  git clone git@github.com:Consensys/skills.git ~/dev/Consensys/skills',
      '  export CONSENSYS_SKILLS_DIR=~/dev/Consensys/skills',
      '',
      'Then re-run `yarn skills`.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

const result = spawnSync(
  'bash',
  [sync, '--repo', REPO, '--target', process.cwd(), ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
process.exit(result.status === null ? 1 : result.status);
