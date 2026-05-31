import { execFile } from 'child_process';

/** All E2E ports that may need cleanup between runs. */
const SPECULOS_E2E_PORTS = [
  9876, // WebHID bridge WebSocket used by the browser mock.
  9998, // Host APDU TCP port for the default Speculos device.
  5001, // Host REST API port for the default Speculos device.
  9999, // Speculos' default APDU TCP port; used inside Docker/local defaults.
  5000, // Speculos' default REST API port; used inside Docker/local defaults.
];

/** Docker container name used for Speculos on non-Linux platforms. */
const SPECULOS_CONTAINER_NAME = 'metamask-speculos';
const IS_LINUX = process.platform === 'linux';

/**
 * Kill all processes on E2E test ports and clean up.
 * On Linux: kills native speculos processes.
 * On non-Linux: also stops Docker containers.
 */
export async function cleanupSpeculosEnvironment(): Promise<void> {
  const timeout = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const port of SPECULOS_E2E_PORTS) {
    try {
      await killPort(port);
    } catch {
      // port may already be free
    }
  }

  try {
    await killByPattern('chromedriver');
  } catch {
    // may already be stopped
  }
  try {
    await killByPattern('Google Chrome for Testing');
  } catch {
    // may already be stopped
  }

  if (IS_LINUX) {
    try {
      await killByPattern('speculos');
    } catch {
      // may already be stopped
    }
  } else {
    try {
      await run('docker', ['stop', SPECULOS_CONTAINER_NAME], 10_000);
    } catch {
      // may already be stopped
    }
  }

  await timeout(2000);
}

/** Kill processes matching a command-line pattern (via pkill / taskkill). */
function killByPattern(pattern: string): Promise<void> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'taskkill' : 'pkill';
    const args =
      process.platform === 'win32' ? ['/F', '/IM', pattern] : ['-f', pattern];
    execFile(cmd, args, () => {
      resolve();
    });
  });
}

/** Find and SIGKILL all processes listening on the given TCP port. */
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

/** Execute a command with a timeout, rejecting on non-zero exit. */
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

/** Execute a command and capture its stdout/stderr, rejecting on non-zero exit. */
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
