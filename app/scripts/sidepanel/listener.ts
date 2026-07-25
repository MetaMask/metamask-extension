import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';

// Content-script side: re-emits the open when the background signals a
// confirmation, since only this context holds the gesture sidePanel.open() needs.
export function setupSidepanelListener() {
  if (process.env.IN_TEST) {
    return;
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type !== EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL) {
      return undefined;
    }

    // sendMessage hits every frame, but only the frame that made the request holds the gesture
    if (!navigator.userActivation?.isActive) {
      return undefined;
    }

    browser.runtime
      .sendMessage({
        type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
        nonce: message.nonce,
      })
      .catch(() => {
        // If activation has expired or the background is unreachable, the open
        // simply won't happen and triggerUi falls back to the notification window.
      });

    return undefined;
  });
}
