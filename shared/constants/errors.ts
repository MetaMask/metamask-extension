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

export function isStateCorruptionError(err: ErrorLike) {
  return (
    err.message === MISSING_VAULT_ERROR ||
    err.message === CORRUPTION_BLOCK_CHECKSUM_MISMATCH
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
export function isBrowserShuttingDownError(error: unknown): error is Error {
  return (
    error instanceof Error && error.message === BROWSER_SHUTTING_DOWN_ERROR
  );
}
