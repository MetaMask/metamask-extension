/**
 * Error handler for page to extension stream disconnections
 *
 * @param remoteLabel - Remote stream name
 * @param error - Stream connection error
 */
export function logStreamDisconnectWarning(
  remoteLabel: string,
  error: Error,
): void {
  console.debug(
    `MetaMask: Content script lost connection to "${remoteLabel}".`,
    error,
  );
}
