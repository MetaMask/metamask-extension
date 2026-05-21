import { execFileSync } from 'child_process';

/**
 * Temporary Husky v8 -> v9 migration.
 *
 * Husky v9 installs Git hooks by setting `core.hooksPath` to `.husky/_`.
 * This repository intentionally keeps hook installation opt-in via
 * `yarn githooks:install`, so we do not want a blanket `prepare` script that
 * installs hooks for every developer during `yarn install`.
 *
 * Existing developers who already opted into hooks under Husky v8 may still
 * have `core.hooksPath` set to `.husky`. If left unchanged, Git will execute
 * `.husky/pre-commit` directly and bypass Husky v9's generated shim in
 * `.husky/_`, which provides PATH setup, init script handling, and `HUSKY=0`
 * support.
 *
 * To avoid disrupting those existing hook users, this migration updates only
 * repositories that are already configured with the old `.husky` hooks path.
 * Repositories without hooks configured remain unchanged.
 *
 * Proposed removal date: August 1 2026. After that date, this script and the
 * `postinstall` call to it can be removed once developers have had enough time
 * to pull this migration and run `yarn install`.
 */

function getHooksPath(): string | undefined {
  try {
    return execFileSync(
      'git',
      ['config', '--local', '--get', 'core.hooksPath'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
  } catch {
    return undefined;
  }
}

function normalizeHooksPath(hooksPath: string): string {
  return hooksPath.trim().replaceAll('\\', '/').replace(/\/+$/u, '');
}

function getYarnCommand(): string {
  return process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
}

const hooksPath = getHooksPath();

if (hooksPath && normalizeHooksPath(hooksPath) === '.husky') {
  console.log('Migrating Husky hooks path from .husky to .husky/_');
  execFileSync(getYarnCommand(), ['githooks:install'], {
    stdio: 'inherit',
  });
}
