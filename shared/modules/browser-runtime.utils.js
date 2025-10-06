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
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../constants/app';

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
/**
 * Returns the name of the browser
 *
 * @param {Bowser} bowser - optional Bowser instance to check against
 * @param {Navigator} navigator - optional Navigator instance to check against
 * @returns {string} The name of the browser
 */
export function getBrowserName(
  bowser = Bowser.getParser(window.navigator.userAgent),
  navigator = window.navigator,
) {
  // Handle case for brave by parsing navigator.userAgent
  if ('brave' in navigator) {
    return 'Brave';
  }

  return bowser.getBrowserName();
}

/**
 * Returns the window type for the application
 *
 * - `popup` refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 * - `fullscreen` refers to the main browser window
 * - `notification` refers to the popup that appears in its own window when taking action outside of metamask
 * - `background` refers to the background page
 *
 * NOTE: This should only be called on internal URLs.
 *
 * @param [url] - the URL of the window
 * @returns the environment ENUM
 */
export function getBrowserWindowType(url = window.location.href) {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPE_POPUP;
  } else if (['/home.html'].includes(parsedUrl.pathname)) {
    return ENVIRONMENT_TYPE_FULLSCREEN;
  } else if (parsedUrl.pathname === '/notification.html') {
    return ENVIRONMENT_TYPE_NOTIFICATION;
  }
  return ENVIRONMENT_TYPE_BACKGROUND;
}
