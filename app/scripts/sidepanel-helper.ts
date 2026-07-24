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
  // Delegates the actual open to the background, which records the outcome so
  // triggerUi can decide between the panel and the notification window.
  openSidePanel: (tabId: number) => void;
};

// Background side: when the user prefers the side panel, hands the tab off to
// the background to open the panel for an allowlisted, dapp-initiated request.
export const setupSidepanelMessageHandler = ({
  isSidepanelPreferred,
  openSidePanel,
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

    if (
      typeof method === 'string' &&
      SIDEPANEL_METHOD_ALLOWLIST.has(method) &&
      isSidepanelPreferred() &&
      tabId
    ) {
      openSidePanel(tabId);
    }

    return undefined;
  });
};
