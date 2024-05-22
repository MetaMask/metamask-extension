/**
 * A simple utility to parse and compare semver versions.
 */

import type ExtensionPlatform from '../../app/scripts/platforms/extension';

/**
 * A semver version object.
 */
export type SemVersion = {
  major: number;
  minor: number;
  patch: number;
};

/**
 * Parse a semver version string into a SemVersion object.
 *
 * @param version - The version string to parse, of the form "major.minor.patch". e.g. "1.2.3"
 * @returns
 */
export const parseVersion = (version: string = ''): SemVersion | null => {
  const [major, minor, patch] = version.split('.').map(Number);

  // if version is not a valid semver, return false
  if ([major, minor, patch].some((num) => isNaN(num) || num < 0)) {
    return null;
  }
  return { major, minor, patch };
};

/**
 * Compare two SemVersion objects.
 *
 * @param a
 * @param b
 * @returns negative if a < b, zero if a === b, positive if a > b
 */
export const compareVersions = (a: SemVersion, b: SemVersion): number => {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
};

/**
 * Get the version of the extension.
 */
export const getMetamaskVersion = () =>
  parseVersion((global.platform as ExtensionPlatform).getVersion());
