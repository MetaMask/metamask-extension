/**
 * Sets up two-way communication between the
 * mainline version of extension and Flask build
 * in order to detect & warn if there are two different
 * versions running simultaneously.
 */

import browser from 'webextension-polyfill';
import {
  PLATFORM_CHROME,
  PLATFORM_FIREFOX,
  CHROME_BUILD_IDS,
  FIREFOX_BUILD_IDS,
} from '../../shared/constants/app';
import { getPlatform } from './lib/util';

const MESSAGE_TEXT = 'isRunning';

const showWarning = () =>
  console.warn('Warning! You have multiple instances of MetaMask running!');

/**
 * Handles the ping message sent from other extension.
 * Displays console warning if it's active.
 *
 * @param message - The message received from the other extension
 */
export const onMessageReceived = (message) => {
  if (message === MESSAGE_TEXT) {
    showWarning();
  }
};

/**
 * Sends the ping message sent to other extensions to detect whether it's active or not.
 */
export const checkForMultipleVersionsRunning = async () => {
  if (getPlatform() !== PLATFORM_CHROME && getPlatform() !== PLATFORM_FIREFOX) {
    return;
  }
  const buildIds =
    getPlatform() === PLATFORM_CHROME ? CHROME_BUILD_IDS : FIREFOX_BUILD_IDS;

  const thisBuild = browser.runtime.id;

  for (const id of buildIds) {
    if (id !== thisBuild) {
      try {
        await browser.runtime.sendMessage(id, MESSAGE_TEXT);
      } catch (error) {
        // Should do nothing if receiving end was not reached (no other instances running)
      }
    }
  }
};
