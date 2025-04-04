import { execFileSync, execSync } from 'node:child_process';
import { arch } from 'node:os';
import {
  type Checksums,
  type PlatformArchChecksums,
  Architecture,
  Binary,
  Platform,
} from './types';

/**
 * No Operation. A function that does nothing and returns nothing.
 *
 * @returns `undefined`
 */
export const noop = () => undefined;

/**
 * Returns the system architecture, normalized to one of the supported
 * {@link Architecture} values.
 *
 * @param architecture - The architecture string to normalize (e.g., 'x64', 'arm64')
 * @returns
 */
export function normalizeSystemArchitecture(
  architecture: string = arch(),
): Architecture {
  if (architecture.startsWith('arm')) {
    // if `arm*`, use `arm64`
    return Architecture.Arm64;
  } else if (architecture === 'x64') {
    // if `x64`, it _might_ be amd64 running via Rosetta on Apple Silicon
    // (arm64). we can check this by running `sysctl.proc_translated` and
    // checking the output; `1` === `arm64`. This can happen if the user is
    // running an amd64 version of Node on Apple Silicon. We want to use the
    // binaries native to the system for better performance.
    try {
      if (execSync('sysctl -n sysctl.proc_translated 2>/dev/null')[0] === 1) {
        return Architecture.Arm64;
      }
    } catch {
      // Ignore error: if sysctl check fails, we assume native amd64
    }
  }

  return Architecture.Amd64; // Default for all other architectures
}

/**
 * Log a message to the console.
 *
 * @param message - The message to log
 */
export function say(message: string) {
  console.log(`[foundryup] ${message}`);
}

/**
 * Get the version of the binary at the given path.
 *
 * @param binPath
 * @returns The `--version` reported by the binary
 * @throws If the binary fails to report its version
 */
export function getVersion(binPath: string): Buffer {
  try {
    return execFileSync(binPath, ['--version']).subarray(0, -1); // ignore newline
  } catch (error: unknown) {
    const msg = `Failed to get version for ${binPath}

Your selected platform or architecture may be incorrect, or the binary may not
support your system. If you believe this is an error, please report it.`;
    if (error instanceof Error) {
      error.message = `${msg}\n\n${error.message}`;
      throw error;
    }
    throw new AggregateError([new Error(msg), error]);
  }
}

export function isCodedError(
  error: unknown,
): error is Error & { code: string } {
  return (
    error instanceof Error && 'code' in error && typeof error.code === 'string'
  );
}

/**
 * Transforms the CLI checksum object into a platform+arch-specific checksum
 * object.
 *
 * @param checksums - The CLI checksum object
 * @param targetPlatform - The build platform
 * @param targetArch - The build architecture
 * @returns
 */
export function transformChecksums(
  checksums: Checksums | undefined,
  targetPlatform: Platform,
  targetArch: Architecture,
): PlatformArchChecksums | null {
  if (!checksums) {
    return null;
  }

  const key = `${targetPlatform}-${targetArch}` as const;
  return {
    algorithm: checksums.algorithm,
    binaries: Object.entries(checksums.binaries).reduce(
      (acc, [name, record]) => {
        acc[name as Binary] = record[key];
        return acc;
      },
      {} as Record<Binary, string>,
    ),
  };
}
