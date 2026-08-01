import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';

// Content-script side: re-emits the open when the background signals a REQUEST_OPEN_SIDEPANEL,
// since only this context holds the gesture chrome.sidePanel.open() needs
export function onRequestOpenSidepanel(message: {
  type?: string;
  nonce?: string;
}) {
  if (message?.type !== EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL) {
    return undefined;
  }

  // Background browser.tabs.sendMessage hits every frame, but only the one that made the request holds the gesture
  if (!navigator.userActivation?.isActive) {
    console.log('Request to open sidepanel ignored');
    return undefined;
  }

  browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
      nonce: message.nonce,
    })
    .catch((err) => {
      // If activation has expired or the background is unreachable, the open
      // simply won't happen and triggerUi falls back to the notification window.
      console.log('Failed to send request to background', err);
    });

  return undefined;
}
