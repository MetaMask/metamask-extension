import log from 'loglevel';

/**
 * Attempts to post a `message` to the given `port` via `port.postMessage`. If
 * the postMessage call fails due to an exception it will ignore it by catching
 * and then logging it.
 *
 * @param port - The port to post the message to.
 * @param method - The method to call on the port.
 * @param params - The parameters to include in the message.
 * @returns Returns true if the message was posted successfully, false otherwise.
 */
export function tryPostMessage(
  port: chrome.runtime.Port,
  method: string,
  params?: Record<string, unknown>,
): boolean {
  const message = {
    data: {
      method,
      params,
    },
  };
  try {
    port.postMessage(message);
    return true;
  } catch (e) {
    // an exception can occur here if the Window has since disconnected from
    // the background, this might be expected, for example, if the UI is closed
    // while we are still initializing the background (like during a call to
    // `await isInitialized;`)
    log.error('MetaMask - Failed to message to port', e, message);
    return false;
  }
}
