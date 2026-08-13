/**
 * Get the Sentry release string from the current build environment and version.
 *
 * @param environment - The build environment, preferably `METAMASK_ENVIRONMENT`.
 * @param version - The SemVer version string.
 * @returns A combined string that fits the Sentry release name conventions.
 */
export function getSentryRelease(environment: string, version: string): string {
  const packageName =
    environment === 'production'
      ? 'metamask-extension'
      : `metamask-extension-test`;
  return `${packageName}@${version}`;
}
