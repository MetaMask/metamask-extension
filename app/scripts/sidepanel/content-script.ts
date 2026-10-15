import browser from 'webextension-polyfill';
import { isObject } from '@metamask/utils';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';

/**
 * Re-emits the open action when the background signals a REQUEST_OPEN_SIDEPANEL.
 *
 * @param message - The message received from the background script.
 * @param message.type - The message type.
 * @param message.nonce - The nonce correlating the open request.
 */
export function onRequestOpenSidepanel(message: unknown): void {
  if (
    !isObject(message) ||
    message.type !== EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL ||
    typeof message.nonce !== 'string'
  ) {
    return;
  }

  // Background browser.tabs.sendMessage hits every frame, but only the one that made the request holds the gesture
  if (!navigator.userActivation?.isActive) {
    return;
  }

  browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
      nonce: message.nonce,
    })
    // triggerUi falls back to the notification window on failure
    .catch(() => undefined);
}
