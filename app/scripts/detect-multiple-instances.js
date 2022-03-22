/**
 * Sets up two-way communication between the
 * mainline version of extension and Flask build
 * in order to detect & warn if there are two different
 * versions running simultaneously.
 */

import {
  METAMASK_PROD_BUILD_ID,
  METAMASK_FLASK_BUILD_ID,
} from '../../shared/constants/app';

import extension from 'extensionizer';

const MESSAGE_TEXT = 'isRunning';

/**
 * Handles the ping message sent from other extension.
 */
export const onMessageReceived = (message) => {
  if (message === MESSAGE_TEXT) {
    console.warn('Warning! You have multiple instances of MetaMask running!');
  }
};

/**
 * Sends the ping message sent to other extension to detect whether it's active or not.
 * Displays console warning if it's active.
 */
export const checkForMultipleVersionsRunning = () => {
  const idToPing =
    extension.runtime.id === METAMASK_FLASK_BUILD_ID
      ? METAMASK_PROD_BUILD_ID
      : METAMASK_FLASK_BUILD_ID;

  extension.runtime.sendMessage(idToPing, MESSAGE_TEXT);
};
