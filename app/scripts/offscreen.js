import { OffscreenCommunicationTarget } from '../../shared/constants/offscreen-communication';

/**
 * Creates an offscreen document that can be used to load additional scripts
 * and iframes that can communicate with the extension through the chrome
 * runtime API. Only one offscreen document may exist, so any iframes required
 * by extension can be embedded in the offscreen.html file. See the offscreen
 * folder for more details.
 */
export async function createOffscreen() {
  const { chrome } = globalThis;
  if (!chrome.offscreen || (await chrome.offscreen.hasDocument())) {
    return;
  }

  const loadPromise = new Promise((resolve) => {
    const messageListener = (msg) => {
      if (
        msg.target === OffscreenCommunicationTarget.extensionMain &&
        msg.isBooted
      ) {
        chrome.runtime.onMessage.removeListener(messageListener);
        resolve();
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
  });

  await chrome.offscreen.createDocument({
    url: './offscreen.html',
    reasons: ['IFRAME_SCRIPTING'],
    justification:
      'Used for Hardware Wallet and Snaps scripts to communicate with the extension.',
  });

  // In case we are in a bad state where the offscreen document is not loading, timeout and let execution continue.
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

  await Promise.race([loadPromise, timeoutPromise]);

  console.debug('Offscreen iframe loaded');
}
