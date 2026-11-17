type ShutdownSignal = 'SIGINT' | 'SIGTERM';

type ShutdownChild = {
  channel?: unknown;
  send?: (message: string, callback: (error: Error | null) => void) => boolean;
  kill: (signal: NodeJS.Signals) => boolean;
};

type CompletionProcess = {
  ppid: number;
  connected?: boolean;
  send?: (message: string, callback: (error: Error | null) => void) => boolean;
  kill: (pid: number, signal: NodeJS.Signals) => boolean;
};

/**
 * Forwards a shutdown request and releases the parent after IPC delivery.
 *
 * @param child - The build child.
 * @param signal - The requested shutdown signal.
 * @param onRequestSent - Called once the request is sent.
 */
export function requestChildShutdown(
  child: ShutdownChild,
  signal: ShutdownSignal,
  onRequestSent: () => void,
): void {
  if (child.channel && child.send) {
    let isRequestSent = false;
    const markRequestSent = () => {
      if (!isRequestSent) {
        isRequestSent = true;
        onRequestSent();
      }
    };

    try {
      child.send(signal, (error) => {
        if (error) {
          child.kill(signal);
        }
        markRequestSent();
      });
    } catch {
      child.kill(signal);
      markRequestSent();
    }
    return;
  }

  child.kill(signal);
  onRequestSent();
}

/**
 * Releases a build's parent without interrupting the child's cache write.
 *
 * @param signalProcess - The build child process.
 * @param parentPid - The parent PID recorded when the child was spawned.
 */
export function notifyParentOfBuildCompletion(
  signalProcess: CompletionProcess,
  parentPid: number,
): void {
  try {
    if (signalProcess.send) {
      // A false return means backpressure: the message is still queued.
      // Never fall back to POSIX signals on a process with an IPC channel.
      if (signalProcess.connected) {
        signalProcess.send('SIGUSR2', (error) => {
          if (error) {
            ignoreMissingParent(error);
          }
        });
      }
    } else if (signalProcess.ppid === parentPid) {
      // Avoid signaling a reused PID after the original parent has exited.
      signalProcess.kill(parentPid, 'SIGUSR2');
    }
  } catch (error) {
    ignoreMissingParent(error);
  }
}

function ignoreMissingParent(error: unknown): void {
  const { code } = error as NodeJS.ErrnoException;
  if (code !== 'ESRCH' && code !== 'ERR_IPC_CHANNEL_CLOSED') {
    throw error;
  }
}
