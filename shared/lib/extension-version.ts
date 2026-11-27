import semver from 'semver';

/** Regex for four-segment versions (e.g. beta builds: 10.2.3.111). */
const FOUR_SEGMENT_VERSION_REGEX = /^\d+\.\d+\.\d+\.\d+$/u;

/**
 * Converts a version string to a comparable tuple [major, minor, patch, fourth].
 * Supports both semver (3 segments) and four-segment versions (e.g. 10.2.3.112).
 * Three-segment versions get a fourth segment of 0.
 *
 * @param versionStr - Version string (e.g. '10.2.3' or '10.2.3.112').
 * @returns Tuple of 4 numbers, or null if unparseable.
 */
function versionToComparable(
  versionStr: string | undefined,
): [number, number, number, number] | null {
  if (typeof versionStr !== 'string' || versionStr.length === 0) {
    return null;
  }
  if (FOUR_SEGMENT_VERSION_REGEX.test(versionStr)) {
    const segments = versionStr.split('.').map(Number);
    return [segments[0], segments[1], segments[2], segments[3]];
  }
  const coerced = semver.coerce(versionStr);
  const valid = semver.valid(coerced);
  if (!valid) {
    return null;
  }
  const parsed = semver.parse(valid);
  if (!parsed) {
    return null;
  }
  return [parsed.major, parsed.minor, parsed.patch, 0];
}

/**
 * Returns true when the version string can be compared as an extension version.
 *
 * @param versionStr - Version string to validate.
 * @returns Whether the version is parseable.
 */
export function isValidExtensionVersion(
  versionStr: string | undefined,
): boolean {
  return versionToComparable(versionStr) !== null;
}

/**
 * Returns true if the first version is strictly greater than the second.
 * Supports four-segment versions (e.g. 10.2.3.111 vs 10.2.3.112) and mixed
 * comparison with three-segment semver.
 *
 * @param newerCandidate - Version that should be greater.
 * @param olderCandidate - Version that should be smaller.
 * @returns True if newerCandidate > olderCandidate.
 */
export function isExtensionVersionNewer(
  newerCandidate: string | undefined,
  olderCandidate: string | undefined,
): boolean {
  const newer = versionToComparable(newerCandidate);
  const older = versionToComparable(olderCandidate);
  if (!newer || !older) {
    return false;
  }
  for (let index = 0; index < 4; index++) {
    if (newer[index] > older[index]) {
      return true;
    }
    if (newer[index] < older[index]) {
      return false;
    }
  }
  return false;
}
