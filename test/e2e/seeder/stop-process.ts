import type { ChildProcess } from 'child_process';

const SIGTERM_TIMEOUT_MS = 10_000;
const SIGKILL_TIMEOUT_MS = 5_000;

/**
 * Stops a spawned local node process and waits for it to exit.
 *
 * Sends SIGTERM first, then SIGKILL if needed. After SIGKILL, waits for the
 * `exit` event (up to {@link SIGKILL_TIMEOUT_MS}) and throws if the process is
 * still alive so teardown does not race directory cleanup.
 *
 * @param childProcess - The spawned child process to stop.
 */
export async function stopProcess(childProcess: ChildProcess): Promise<void> {
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return;
  }

  const exitPromise = new Promise<void>((resolvePromise) => {
    childProcess.once('exit', () => resolvePromise());
  });

  killProcessTree(childProcess, 'SIGTERM');

  const exitedAfterTerm = await Promise.race([
    exitPromise.then(() => true),
    new Promise<false>((resolvePromise) => {
      setTimeout(() => {
        resolvePromise(false);
      }, SIGTERM_TIMEOUT_MS);
    }),
  ]);

  if (exitedAfterTerm) {
    return;
  }

  killProcessTree(childProcess, 'SIGKILL');

  const exitedAfterKill = await Promise.race([
    exitPromise.then(() => true),
    new Promise<false>((resolvePromise) => {
      setTimeout(() => {
        resolvePromise(false);
      }, SIGKILL_TIMEOUT_MS);
    }),
  ]);

  if (!exitedAfterKill) {
    throw new Error(
      `Child process (pid=${childProcess.pid ?? 'unknown'}) did not exit after SIGKILL`,
    );
  }
}

function killProcessTree(
  childProcess: ChildProcess,
  signal: NodeJS.Signals,
): void {
  if (process.platform === 'win32') {
    childProcess.kill(signal);
    return;
  }

  if (childProcess.pid) {
    try {
      process.kill(-childProcess.pid, signal);
    } catch {
      childProcess.kill(signal);
    }
  }
}
