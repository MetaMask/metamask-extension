import { execFileSync } from 'node:child_process';
import path from 'node:path';

function mm(args: string[], cwd: string): void {
  try {
    execFileSync(path.join(cwd, 'node_modules', '.bin', 'mm'), args, {
      cwd,
      encoding: 'utf-8',
      timeout: 30_000,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
  } catch (_err) {
    console.error(`[teardown] mm ${args.join(' ')} failed:`, _err);
  }
}

export function teardownTrial(cwd: string, shutdown = false): void {
  if (shutdown) {
    mm(['cleanup', '--shutdown'], cwd);
  } else {
    mm(['cleanup'], cwd);
  }
}
