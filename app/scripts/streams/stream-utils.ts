/**
 * Error handler for page to extension stream disconnections.
 *
 * @param remoteLabel - The name of the remote stream that was disconnected.
 * @param error - The stream connection error that occurred.
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
