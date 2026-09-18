import { parse } from 'semver';
import { SemVerVersion } from '@metamask/utils';
import type { ClientConfig } from '@metamask/snaps-controllers';

/**
 * Get the client config (type and version) for the client.
 *
 * @returns The client config.
 */
export function getClientConfig(): ClientConfig {
  const originalVersion = process.env.METAMASK_VERSION;
  const parsedVersion = parse(originalVersion);

  // Strip prerelease versions as they just indicate build types.
  const version = (
    parsedVersion
      ? `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch}`
      : originalVersion
  ) as SemVerVersion;

  return {
    type: 'extension',
    version,
  };
}
