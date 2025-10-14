/**
 *
 *
 * @param {string} environment
 * @param {string} version
 * @returns
 */
export function getSentryRelease(environment, version) {
  const packageName =
    environment === 'production'
      ? 'metamask-extension'
      : `metamask-extension-${environment}`;
  return `${packageName}@${version}`;
}
