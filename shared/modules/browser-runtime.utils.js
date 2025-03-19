/**
 * Utility Functions to support browser.runtime JavaScript API
 */

import Bowser from 'bowser';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import {
  BROKEN_PRERENDER_BROWSER_VERSIONS,
  FIXED_PRERENDER_BROWSER_VERSIONS,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../ui/helpers/constants/common';

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

/**
 * Returns true if the browser is affected by a regression that causes the
 * extension port stream established between the contentscript and background
 * to be broken when a prerendered (eagerly rendered, hidden) page becomes active (visible to the user).
 *
 * @param {Bowser} bowser - optional Bowser instance to check against
 * @returns {boolean} Whether the browser is affected by the prerender regression
 */
export function getIsBrowserPrerenderBroken(
  bowser = Bowser.getParser(window.navigator.userAgent),
) {
  return (
    (bowser.satisfies(BROKEN_PRERENDER_BROWSER_VERSIONS) &&
      !bowser.satisfies(FIXED_PRERENDER_BROWSER_VERSIONS)) ??
    false
  );
}
