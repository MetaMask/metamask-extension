/**
 * Get the Sentry release string from the current build environment and version.
 *
 * @param {string} environment - The build environment, preferably `METAMASK_ENVIRONMENT`.
 * @param {string} version - The SemVer version string.
 * @returns A combined string that fits the Sentry release name conventions.
 */
export function getSentryRelease(environment, version) {
  const packageName =
    environment === 'production'
      ? 'metamask-extension'
      : `metamask-extension-test`;
  return `${packageName}@${version}`;
}
