export type ErrorLike = {
  message: string;
  name: string;
  stack?: string;
};

// This error is emitted from background.js and meant to be handled in the ui
export const MISSING_VAULT_ERROR =
  'Data error: storage.local does not contain vault data';

// This error comes from the browser. Some more details are here https://github.com/MetaMask/metamask-extension/issues/25728
export const CORRUPTION_BLOCK_CHECKSUM_MISMATCH =
  'Corruption: block checksum mismatch';

/**
 * Chrome rejects with this from `PreRunValidation` once the browser has begun
 * shutting down, for `chrome.storage.*`, `chrome.tabs.*`, `chrome.windows.*` and
 * many other extension APIs. It is expected and not actionable: by the time it
 * appears Chrome will shut down (or hang), the flags that cause it are never
 * unset, and it only surfaces once every window, tab, popup and sidepanel has
 * been destroyed.
 */
export const BROWSER_SHUTTING_DOWN_ERROR = 'The browser is shutting down.';

/**
 * Reads the `message` of a thrown value.
 *
 * Deliberately avoids `instanceof Error`, which is unreliable here: an
 * extension has separate realms for the service worker, the offscreen document
 * and each UI context, and an error that crosses one keeps its shape but loses
 * its prototype identity. The message is what identifies these errors anyway.
 *
 * @param error - The thrown value to inspect.
 * @returns The message, or `undefined` if the value does not carry one.
 */
function getThrownErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const { message } = error as { message?: unknown };
  return typeof message === 'string' ? message : undefined;
}

/**
 * Checks whether a thrown value is one of the errors that indicate the
 * persisted state is unusable.
 *
 * @param error - The thrown value to check.
 * @returns True if the error indicates state corruption.
 */
export function isStateCorruptionError(error: unknown): error is ErrorLike {
  const message = getThrownErrorMessage(error);
  return (
    message === MISSING_VAULT_ERROR ||
    message === CORRUPTION_BLOCK_CHECKSUM_MISMATCH
  );
}

/**
 * Checks whether a thrown value is the browser's shutdown rejection, which
 * means a storage operation failed only because the browser is closing rather
 * than because anything is wrong with the data.
 *
 * @param error - The thrown value to check.
 * @returns True if the error is the browser shutdown rejection.
 */
export function isBrowserShuttingDownError(error: unknown): error is ErrorLike {
  return getThrownErrorMessage(error) === BROWSER_SHUTTING_DOWN_ERROR;
}
