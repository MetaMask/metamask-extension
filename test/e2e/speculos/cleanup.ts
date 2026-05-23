import { execFile } from 'child_process';
import { SPECULOS_E2E_PORTS, SPECULOS_CONTAINER_NAME } from './constants';

/**
 * Kill all processes on E2E test ports, stop Docker containers, and prune networks.
 * Safe to call multiple times. Designed for use in after()/afterEach() hooks
 * to guarantee cleanup even when tests fail mid-way.
 */
export async function cleanupSpeculosEnvironment(): Promise<void> {
  const timeout = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // 1. Kill processes on all E2E ports
  for (const port of SPECULOS_E2E_PORTS) {
    try {
      await killPort(port);
    } catch {
      // port may already be free
    }
  }

  // 2. Stop and remove Docker containers
  try {
    await run('docker', ['stop', SPECULOS_CONTAINER_NAME], 10_000);
  } catch {
    // container may not exist
  }
  try {
    await run('docker', ['rm', '-f', SPECULOS_CONTAINER_NAME], 10_000);
  } catch {
    // ignore
  }

  // 3. Remove stale speculos networks (prune can leave ambiguous duplicates)
  try {
    const { stdout } = await runCapture(
      'docker',
      ['network', 'ls', '--filter', 'name=speculos', '-q'],
      10_000,
    );
    const networkIds = stdout.trim().split('\n').filter(Boolean);
    for (const netId of networkIds) {
      try {
        await run('docker', ['network', 'rm', netId.trim()], 5_000);
      } catch {
        // may be in use
      }
    }
  } catch {
    // ignore
  }

  // 4. Wait for OS to release sockets
  await timeout(2000);
}

function killPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'netstat' : 'lsof';
    const args =
      process.platform === 'win32'
        ? ['-ano', '-p', `TCP:${port}`]
        : ['-ti', `:${port}`];

    execFile(cmd, args, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve();
        return;
      }

      const pids = stdout
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (pids.length === 0) {
        resolve();
        return;
      }

      const killArgs = ['-9', ...pids];
      execFile('kill', killArgs, (killErr) => {
        if (killErr) {
          reject(killErr);
        } else {
          resolve();
        }
      });
    });
  });
}

function run(cmd: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = execFile(cmd, args, { timeout: timeoutMs }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    proc.on('error', reject);
  });
}

function runCapture(
  cmd: string,
  args: string[],
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout: stdout ?? '', stderr: stderr ?? '' });
      }
    });
  });
}
