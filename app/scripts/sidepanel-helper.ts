import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import { MESSAGE_TYPE } from '../../shared/constants/app';
import { CONTENT_SCRIPT } from './constants/stream';

// Allowlist of the most common dapp-initiated RPC methods that surface a
// confirmation UI. When the user prefers the side panel, receiving one of these
// from a dapp opens the panel directly from the content script's user-gesture
// context instead of the notification window. Kept intentionally small: start
// with the common confirmation-triggering methods and expand as needed rather
// than reacting to every RPC call.
export const SIDEPANEL_METHOD_ALLOWLIST: ReadonlySet<string> = new Set([
  MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
  MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS,
  MESSAGE_TYPE.WALLET_CREATE_SESSION,
  MESSAGE_TYPE.ETH_SEND_TRANSACTION,
  MESSAGE_TYPE.PERSONAL_SIGN,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
  MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
  MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN,
  MESSAGE_TYPE.WATCH_ASSET,
  MESSAGE_TYPE.WALLET_SEND_CALLS,
]);

const getRequestedMethod = (event: MessageEvent): string | undefined => {
  const method = event.data?.data?.data?.method;
  return typeof method === 'string' ? method : undefined;
};

// Content-script side: forwards allowlisted dapp RPC methods to the background,
// which owns the preference check and the actual `sidePanel.open()` call.
// Called from setupPageStreams.
export const setupSidepanelListener = () => {
  if (process.env.IN_TEST) {
    return;
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.target !== CONTENT_SCRIPT) {
      return;
    }

    const method = getRequestedMethod(event);
    if (!method || !SIDEPANEL_METHOD_ALLOWLIST.has(method)) {
      return;
    }

    browser.runtime
      .sendMessage({ type: EXTENSION_MESSAGES.OPEN_SIDEPANEL, method })
      .catch(() => {
        // Background decides whether to open; nothing to do if it can't be reached.
      });
  });
};

type SidepanelMessageHandlerOptions = {
  isSidepanelPreferred: () => boolean;
};

// Background side: opens the side panel when the user prefers it. triggerUi
// suppresses the notification window whenever the side panel is preferred, so
// the panel is the only surface in that case.
export const setupSidepanelMessageHandler = ({
  isSidepanelPreferred,
}: SidepanelMessageHandlerOptions) => {
  if (process.env.IN_TEST) {
    return;
  }

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== EXTENSION_MESSAGES.OPEN_SIDEPANEL) {
      return undefined;
    }

    const method = message?.method;
    const tabId = sender?.tab?.id;
    // @ts-expect-error sidePanel API not in webextension-polyfill types yet
    const canOpen = Boolean(browser.sidePanel?.open);

    if (
      typeof method === 'string' &&
      SIDEPANEL_METHOD_ALLOWLIST.has(method) &&
      isSidepanelPreferred() &&
      canOpen &&
      tabId
    ) {
      // @ts-expect-error sidePanel API not in webextension-polyfill types yet
      browser.sidePanel.open({ tabId }).catch(() => {
        // Open failed; nothing to recover here.
      });
    }

    return undefined;
  });
};
