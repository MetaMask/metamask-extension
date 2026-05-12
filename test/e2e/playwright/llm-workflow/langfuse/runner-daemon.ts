import { execSync } from 'node:child_process';
import { readDaemonState, isDaemonAlive } from '@metamask/client-mcp-core';

export async function ensureDaemon(repoRoot: string): Promise<number> {
  const state = await readDaemonState(repoRoot);
  if (state && (await isDaemonAlive(state))) {
    process.stderr.write(
      `[RUNNER] Daemon already running on port ${state.port}\n`,
    );
    return state.port;
  }

  process.stderr.write(
    '[RUNNER] Daemon not running — starting via mm launch\n',
  );
  try {
    execSync('npx mm launch --state default --force', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    process.stderr.write('[RUNNER] Daemon + browser session started\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[RUNNER] Failed to start daemon: ${msg}\n`);
    process.exit(1);
  }

  const newState = await readDaemonState(repoRoot);
  return newState?.port ?? 0;
}

export async function getDaemonSessionId(
  port: number,
): Promise<string | undefined> {
  if (!port) return undefined;
  try {
    const resp = await fetch(`http://127.0.0.1:${port}/status`);
    const data = (await resp.json()) as {
      session?: { active: boolean; id: string | null };
    };
    return data.session?.id ?? undefined;
  } catch {
    return undefined;
  }
}

export function cleanupDaemon(repoRoot: string): void {
  try {
    execSync('npx mm cleanup', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    });
    process.stderr.write('[RUNNER] Session cleaned up\n');
  } catch {
    /* fire-and-forget */
  }
}
