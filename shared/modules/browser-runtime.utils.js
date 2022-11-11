import browser from 'webextension-polyfill';

/**
 * Returns an Error if extension.runtime.lastError is present
 * this is a workaround for the non-standard error object that's used
 *
 * @returns {Error|undefined}
 */
export function checkForLastError() {
  const { lastError } = browser.runtime;
  if (!lastError) {
    return undefined;
  }
  // if it quacks like an Error, its an Error
  if (lastError.stack && lastError.message) {
    return lastError;
  }
  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
}

/** @returns {Error|undefined} */
export function checkForLastErrorAndWarn() {
  const error = checkForLastError();

  if (error) {
    console.warn(error);
  }

  return error;
}
