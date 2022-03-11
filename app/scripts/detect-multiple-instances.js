/**
 * Sets up two-way communication between the
 * mainline version of extension and Flask build
 * in order to detect & warn if there are two different
 * versions running simultaneously.
 */

import extension from 'extensionizer';

// TODO: add IDs from other browsers
const PROD_BUILD_ID = 'nkbihfbeogaeaoehlefnkodbefgpgknn';
const FLASK_BUILD_ID = 'ljfoeinjpaedjfecbmggjgodbgkmjkjk';

const MESSAGE_TEXT = 'isRunning';

/**
 * Handles the ping message sent from other extension.
 */
export const onMessageReceived = (message, sender, sendResponse) => {
  if (message === MESSAGE_TEXT) {
    sendResponse({
      type: 'success',
      isRunning: true,
    });
    return true;
  }
  return false;
};

/**
 * Sends the ping message sent to other extension to detect whether it's active or not.
 * Displays console warning if it's active.
 */
export const onExtensionConnect = () => {
  const idToPing =
    extension.runtime.id === FLASK_BUILD_ID ? PROD_BUILD_ID : FLASK_BUILD_ID;

  extension.runtime.sendMessage(idToPing, MESSAGE_TEXT, (response) => {
    if (extension.runtime.lastError || !response) {
      return;
    }
    console.warn('Warning! You have multiple instances of MetaMask running!');
  });
};
