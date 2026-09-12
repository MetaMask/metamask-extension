import { lstatSync, realpathSync } from 'node:fs';
import path from 'node:path';

export async function browserPid(port: number): Promise<string> {
  const version = await (
    await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(8000),
    })
  ).json();
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  try {
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = reject;
    });
    return await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Browser process discovery timed out')),
        8000,
      );
      socket.onmessage = ({ data }) => {
        clearTimeout(timer);
        const message = JSON.parse(String(data));
        const browsers = message.result?.processInfo?.filter(
          (entry: { type: string }) => entry.type === 'browser',
        );
        if (browsers?.length === 1) {
          resolve(String(browsers[0].id));
        } else {
          reject(new Error('Expected one browser process'));
        }
      };
      socket.send(
        JSON.stringify({ id: 1, method: 'SystemInfo.getProcessInfo' }),
      );
    });
  } finally {
    socket.close();
  }
}

export function isColdMode(mode: string): boolean {
  return mode === 'immediate' || mode === 'delayed';
}

/**
 * Resolve a local measurement path without leaving its declared workspace.
 * Existing symlink ancestors must also stay inside that workspace.
 *
 * @param root - Trusted workspace or artifact directory.
 * @param input - Relative path or absolute path inside root.
 */
export function resolveMeasurementPath(root: string, input: string): string {
  const base = realpathSync(root);
  const lexicalBase = path.resolve(root);
  const resolved = path.resolve(lexicalBase, input);
  const relative = path.relative(lexicalBase, resolved);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error('Measurement path leaves its workspace');
  }
  let ancestor = resolved;
  while (!lstatSync(ancestor, { throwIfNoEntry: false })) {
    ancestor = path.dirname(ancestor);
  }
  const canonicalRelative = path.relative(base, realpathSync(ancestor));
  if (
    canonicalRelative === '..' ||
    canonicalRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(canonicalRelative)
  ) {
    throw new Error('Measurement symlink leaves its workspace');
  }
  return resolved;
}
