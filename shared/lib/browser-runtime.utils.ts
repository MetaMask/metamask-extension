/**
 * Utility Functions to support browser.runtime JavaScript API
 */

import Bowser from 'bowser';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import {
  PLATFORM_BRAVE,
  PLATFORM_EDGE,
  PLATFORM_FIREFOX,
} from '../constants/app';
import {
  BROKEN_PRERENDER_BROWSER_VERSIONS,
  FIXED_PRERENDER_BROWSER_VERSIONS,
  // TODO: Remove restricted import
  // eslint-disable-next-line import-x/no-restricted-paths
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
 * @returns The last error, or undefined
 */
export function checkForLastError(): Error | undefined {
  const { lastError } = browser.runtime;
  if (!lastError) {
    return undefined;
  }
  // if it quacks like an Error, its an Error
  if ('stack' in lastError && lastError.stack && lastError.message) {
    return lastError as Error;
  }
  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
}

/**
 * @returns The last error, or undefined
 */
export function checkForLastErrorAndLog(): Error | undefined {
  const error = checkForLastError();

  if (error) {
    log.error(error);
  }

  return error;
}

/**
 * @returns The last error, or undefined
 */
export function checkForLastErrorAndWarn(): Error | undefined {
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
 * @param bowser - optional Bowser instance to check against
 * @returns Whether the browser is affected by the prerender regression
 */
export function getIsBrowserPrerenderBroken(
  bowser: Bowser.Parser.Parser = Bowser.getParser(window.navigator.userAgent),
): boolean {
  return (
    (bowser.satisfies(BROKEN_PRERENDER_BROWSER_VERSIONS) &&
      !bowser.satisfies(FIXED_PRERENDER_BROWSER_VERSIONS)) ??
    false
  );
}

/**
 * Returns the name of the browser
 *
 * @param bowser - optional Bowser instance to check against
 * @param navigator - optional Navigator instance to check against
 * @returns The name of the browser
 */
export function getBrowserName(
  bowser: Bowser.Parser.Parser = Bowser.getParser(window.navigator.userAgent),
  navigator: Navigator = window.navigator,
): string {
  // Handle case for brave by parsing navigator.userAgent
  if ('brave' in navigator) {
    return 'Brave';
  }

  return bowser.getBrowserName();
}

/**
 * Checks whether the current browser is Firefox.
 *
 * @param args - Same optional `[bowser, navigator]` accepted by {@link getBrowserName}.
 * @returns Whether the host browser is Firefox (MV2 extension build).
 */
export function isFirefoxBrowser(
  ...args: Parameters<typeof getBrowserName>
): boolean {
  return getBrowserName(...args) === PLATFORM_FIREFOX;
}

/**
 * Camera settings URL for Chromium-based browsers (Chrome, Brave, Edge).
 *
 * @param args - Same optional `[bowser, navigator]` accepted by {@link getBrowserName}.
 * @returns `chrome://`, `brave://`, or `edge://` settings path for camera permissions.
 */
export function getChromiumCameraSettingsUrl(
  ...args: Parameters<typeof getBrowserName>
): string {
  const name = getBrowserName(...args);
  if (name === PLATFORM_BRAVE) {
    return 'brave://settings/content/camera';
  }
  // Bowser reports "Microsoft Edge"; PLATFORM_EDGE is the short analytics id "Edge".
  if (name === PLATFORM_EDGE || name === 'Microsoft Edge') {
    return 'edge://settings/content/camera';
  }
  return 'chrome://settings/content/camera';
}

/**
 * Chromium-family browsers URL that opens **this extension's** site settings.
 * Uses {@link browser.runtime.getURL} so the `site` query parameter always matches the running build.
 *
 * @param args - Same optional `[bowser, navigator]` accepted by {@link getBrowserName}.
 * @returns `chrome://`, `brave://`, or `edge://` site-details URL with encoded `chrome-extension://…/` site.
 */
export function getChromiumExtensionCameraSiteSettingsUrl(
  ...args: Parameters<typeof getBrowserName>
): string {
  const extensionRootUrl = browser.runtime.getURL('/');
  const site = encodeURIComponent(extensionRootUrl);
  const name = getBrowserName(...args);
  if (name === PLATFORM_BRAVE) {
    return `brave://settings/content/siteDetails?site=${site}`;
  }
  if (name === PLATFORM_EDGE || name === 'Microsoft Edge') {
    return `edge://settings/content/siteDetails?site=${site}`;
  }
  return `chrome://settings/content/siteDetails?site=${site}`;
}

/**
 * Shortened `moz-extension://…` origin so users can match Firefox camera
 * permission entries. Only meaningful on Firefox; on other browsers the
 * `moz-extension://` URL scheme is not used and this returns an empty string.
 *
 * @returns Display string, or empty string if unavailable.
 */
export function getMozExtensionOriginForDisplay(): string {
  try {
    const url = browser.runtime.getURL('');
    const match = /^moz-extension:\/\/([^/]+)/u.exec(url);
    if (!match) {
      return url;
    }
    const uuid = match[1];
    const compact = uuid.replaceAll('-', '');
    if (compact.length <= 15) {
      return `moz-extension://${uuid}`;
    }
    return `moz-extension://${compact.slice(0, 8)}…${compact.slice(-7)}`;
  } catch {
    return '';
  }
}
