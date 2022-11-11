/**
 * Utility Functions to support browser.runtime JavaScript API
 */

import browser from 'webextension-polyfill';
import log from 'loglevel';

/**
 * Returns an Error if extension.runtime.lastError is present
 * this is a workaround for the non-standard error object that's used
 *
 * According to the docs, we are expected to check lastError in runtime API callbacks:
 * "
 * If you call an asynchronous function that may set lastError, you are expected to
 * check for the error when you handle the result of the function. If lastError has been
 * set and you don't check it within the callback function, then an error will be raised.
 * "
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/lastError}
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
export function checkForLastErrorAndLog() {
  const error = checkForLastError();

  if (error) {
    log.error(error);
  }

  return error;
}

/** @returns {Error|undefined} */
export function checkForLastErrorAndWarn() {
  const error = checkForLastError();

  if (error) {
    console.warn(error);
  }

  return error;
}
