/**
 * Sets up two-way communication between the
 * mainline version of extension and Flask build
 * in order to detect & warn if there are two different
 * versions running simultaneously.
 */

import browser from 'webextension-polyfill';
import { getPlatform } from './lib/util';
import {
  METAMASK_PROD_CHROME_ID,
  METAMASK_FLASK_CHROME_ID,
  METAMASK_PROD_FIREFOX_ID
} from '../../shared/constants/app';

const MESSAGE_TEXT = 'isRunning';

const showWarning = () =>
  console.warn('Warning! You have multiple instances of MetaMask running!');

/**
 * Handles the ping message sent from other extension.
 *
 * @param message - The message received from the other extension
 */
export const onMessageReceived = (message) => {
  if (message === MESSAGE_TEXT) {
    showWarning();
  }
};

/**
 * Sends the ping message sent to other extension to detect whether it's active or not.
 * Displays console warning if it's active.
 */
export const checkForMultipleVersionsRunning = () => {
  if (getPlatform() === PLATFORM_CHROME) {
    if (browser.runtime.id !== METAMASK_FLASK_CHROME_ID) {
      browser.runtime.sendMessage(METAMASK_FLASK_CHROME_ID, MESSAGE_TEXT);
    }
    if (browser.runtime.id !== METAMASK_PROD_CHROME_ID) {
      browser.runtime.sendMessage(METAMASK_PROD_CHROME_ID, MESSAGE_TEXT);
    }
  }
  if (getPlatform() === PLATFORM_FIREFOX) {
    if (browser.runtime.id !== METAMASK_PROD_FIREFOX_ID) {
      browser.runtime.sendMessage(METAMASK_PROD_FIREFOX_ID, MESSAGE_TEXT);
    }
  }
};
