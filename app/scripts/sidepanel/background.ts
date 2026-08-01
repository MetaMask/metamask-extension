import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';

// How long to wait for the request to open sidepanel before falling back to notification
const roundtripTimeoutMs = 500;

type PendingOpen = {
  resolve: (opened: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
};

// Background side: registers the OPEN_SIDEPANEL handler and
// returns a callback which sends the REQUEST_OPEN_SIDEPANEL message
export function createSidepanelOpener() {
  if (process.env.IN_TEST) {
    return () => Promise.resolve(false);
  }

  const pendingOpens = new Map<string, PendingOpen>();

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== EXTENSION_MESSAGES.OPEN_SIDEPANEL) {
      return undefined;
    }

    const entry = pendingOpens.get(message.nonce);
    if (!entry) {
      return undefined;
    }
    clearTimeout(entry.timer);
    pendingOpens.delete(message.nonce);

    const tabId = sender?.tab?.id;
    if (!tabId || !chrome.sidePanel?.open) {
      entry.resolve(false);
      return undefined;
    }

    // open() must run synchronously to consume the gesture the content script just forwarded
    chrome.sidePanel
      .open({ tabId })
      .then(() => entry.resolve(true))
      .catch((err: unknown) => {
        entry.resolve(false);
        console.log('Failed to open sidepanel', err);
      });

    return undefined;
  });

  function requestOpenSidePanel(tabId: number): Promise<boolean> {
    const nonce = `${Date.now()}:${Math.random()}`;

    const openPromise = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        pendingOpens.delete(nonce);
        resolve(false);
      }, roundtripTimeoutMs);

      pendingOpens.set(nonce, { resolve, timer });
    });

    browser.tabs
      .sendMessage(tabId, {
        type: EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL,
        nonce,
      })
      .catch((err) => {
        // Fail fast so triggerUi can open the notification without waiting out
        const entry = pendingOpens.get(nonce);
        if (!entry) {
          return;
        }
        clearTimeout(entry.timer);
        pendingOpens.delete(nonce);
        entry.resolve(false);

        console.log('Failed to send request to tab', tabId, err);
      });

    return openPromise;
  }

  return requestOpenSidePanel;
}
