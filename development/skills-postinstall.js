#!/usr/bin/env node
// Auto-update skills on `yarn install`. Best-effort: never fails the install.
//
// - Skipped on CI, or when SKILLS_SKIP_POSTINSTALL=1.
// - Clones https://github.com/MetaMask/skills (public, no auth) into
//   .skills-cache/metamask-skills if absent.
// - `git fetch + reset` to origin/main if present.
// - Runs tools/install against this repo.
// - If CONSENSYS_SKILLS_DIR is set, layered as additional source so
//   internal overlays apply too.
// - All errors swallowed with a one-line warning. Engineers can run
//   `yarn skills` manually for interactive feedback.

const { spawnSync } = require('child_process');
const { existsSync, mkdirSync, statSync } = require('fs');
const path = require('path');

if (process.env.CI || process.env.SKILLS_SKIP_POSTINSTALL) {
  process.exit(0);
}

const REPO = 'metamask-extension';
const CACHE_DIR = '.skills-cache/metamask-skills';
const PUBLIC_REPO = 'https://github.com/MetaMask/skills.git';

function warn(msg) {
  process.stderr.write(
    `skills postinstall: ${msg} (run \`yarn skills\` for details)\n`,
  );
}

function run(cmd, args) {
  return spawnSync(cmd, args, { stdio: 'ignore' });
}

function isGitDir(dir) {
  try {
    return statSync(path.join(dir, '.git')).isDirectory();
  } catch (_) {
    return false;
  }
}

if (!isGitDir(CACHE_DIR)) {
  mkdirSync(path.dirname(CACHE_DIR), { recursive: true });
  const clone = run('git', ['clone', '--depth', '1', PUBLIC_REPO, CACHE_DIR]);
  if (clone.status !== 0) {
    warn('clone failed (offline?)');
    process.exit(0);
  }
} else {
  const fetch = run('git', [
    '-C',
    CACHE_DIR,
    'fetch',
    '--depth',
    '1',
    'origin',
    'main',
  ]);
  if (fetch.status !== 0) {
    warn('fetch failed (offline?)');
    process.exit(0);
  }
  const reset = run('git', ['-C', CACHE_DIR, 'reset', '--hard', 'origin/main']);
  if (reset.status !== 0) {
    warn('reset failed');
    process.exit(0);
  }
}

const args = [
  '--repo',
  REPO,
  '--target',
  '.',
  '--source',
  path.join(process.cwd(), CACHE_DIR),
];
const consensys = process.env.CONSENSYS_SKILLS_DIR;
if (consensys && existsSync(path.join(consensys, 'domains'))) {
  args.push('--source', consensys);
}

const installer = path.join(CACHE_DIR, 'tools', 'install');
const result = run('bash', [installer, ...args]);
if (result.status !== 0) {
  warn('install failed');
}
process.exit(0);
