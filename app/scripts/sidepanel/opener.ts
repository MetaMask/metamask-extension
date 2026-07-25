import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import type { PendingOpen, SidepanelOpenerOptions } from './types';

// How long to wait for the round-trip open before falling back to notification.
const SIDE_PANEL_ROUNDTRIP_TIMEOUT_MS = 500;

// Background side: registers the OPEN_SIDEPANEL handler and returns
// requestSidePanelOpenFromTab(tabId), which pings the tab and resolves with
// whether the content script's gesture opened the panel
export function createSidepanelOpener({
  isSidepanelPreferred,
}: SidepanelOpenerOptions) {
  // In-flight opens keyed by nonce; self-cleans on resolve or timeout.
  const pendingOpens = new Map<string, PendingOpen>();

  if (!process.env.IN_TEST) {
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
      if (!isSidepanelPreferred() || !tabId || !chrome.sidePanel?.open) {
        entry.resolve(false);
        return undefined;
      }

      // open() must run synchronously here to consume the gesture the content
      // script just forwarded; resolve the waiting triggerUi via callbacks.
      chrome.sidePanel
        .open({ tabId })
        .then(() => entry.resolve(true))
        .catch(() => entry.resolve(false));

      return undefined;
    });
  }

  function requestSidePanelOpenFromTab(tabId: number): Promise<boolean> {
    if (!chrome.sidePanel?.open) {
      return Promise.resolve(false);
    }

    const nonce = `${Date.now()}:${Math.random()}`;
    const result = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        pendingOpens.delete(nonce);
        resolve(false);
      }, SIDE_PANEL_ROUNDTRIP_TIMEOUT_MS);
      pendingOpens.set(nonce, { resolve, timer });
    });

    browser.tabs
      .sendMessage(tabId, {
        type: EXTENSION_MESSAGES.REQUEST_OPEN_SIDEPANEL,
        nonce,
      })
      .catch(() => {
        // No content script on this tab (e.g. chrome:// page); let it time out.
      });

    return result;
  }

  return { requestSidePanelOpenFromTab };
}
