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
 * Checks whether a thrown value has the shape of an error.
 *
 * Deliberately avoids `instanceof Error`, which is unreliable here: an
 * extension has separate realms for the service worker, the offscreen document
 * and each UI context, and an error that crosses one keeps its shape but loses
 * its prototype identity. Errors serialized over the critical-error port are
 * plain objects for the same reason.
 *
 * Both `message` and `name` are checked so the narrowing is sound - callers can
 * rely on every property `ErrorLike` declares.
 *
 * @param error - The thrown value to inspect.
 * @returns True if the value carries a string `message` and `name`.
 */
function isErrorLike(error: unknown): error is ErrorLike {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { message, name } = error as { message?: unknown; name?: unknown };
  return typeof message === 'string' && typeof name === 'string';
}

/**
 * Checks whether a thrown value is one of the errors that indicate the
 * persisted state is unusable.
 *
 * @param error - The thrown value to check.
 * @returns True if the error indicates state corruption.
 */
export function isStateCorruptionError(error: unknown): error is ErrorLike {
  return (
    isErrorLike(error) &&
    (error.message === MISSING_VAULT_ERROR ||
      error.message === CORRUPTION_BLOCK_CHECKSUM_MISMATCH)
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
  return isErrorLike(error) && error.message === BROWSER_SHUTTING_DOWN_ERROR;
}
