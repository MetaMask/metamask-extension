import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';

/**
 * Re-emits the open action when the background signals a REQUEST_OPEN_SIDEPANEL.
 *
 * @param message - The message received from the background script.
 * @param message.type - The message type.
 * @param message.nonce - The nonce correlating the open request.
 */
export function onRequestOpenSidepanel(message: {
  type?: string;
  nonce?: string;
}) {
  if (message?.type !== EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL) {
    return undefined;
  }

  // Background browser.tabs.sendMessage hits every frame, but only the one that made the request holds the gesture
  if (!navigator.userActivation?.isActive) {
    return undefined;
  }

  browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
      nonce: message.nonce,
    })
    // triggerUi falls back to the notification window on failure
    .catch(() => undefined);

  return undefined;
}
