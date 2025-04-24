import { browser } from 'webextension-polyfill';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  KnownOrigins,
} from '../../shared/constants/offscreen-communication';
import { CallbackProcessor } from './callback-processor';

const LEDGER_FRAME_TARGET = 'LEDGER-IFRAME';

/**
 * The ledger keyring iframe will send this event name when the ledger is
 * connected to the iframe.
 */
const LEDGER_KEYRING_IFRAME_CONNECTED_EVENT = 'ledger-connection-event';

const callbackProcessor = new CallbackProcessor();

const BROWSER_TAB_URL = 'http://localhost:5173/';

let browserTab: Window | null = null;

function setupMessageListeners() {
  // This listener receives action responses from the live ledger iframe
  // Then forwards the response to the offscreen bridge
  window.addEventListener('message', (msg) => {
    const { origin, data, source } = msg;
    console.log('msg', msg);
    console.log('message', origin, data, source);
    if (source !== browserTab) {
      return;
    }

    if (data) {
      if (data.action === LEDGER_KEYRING_IFRAME_CONNECTED_EVENT) {
        chrome.runtime.sendMessage({
          action: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: data.payload.connected,
        });

        return;
      }

      if (data.action === LedgerAction.ledgerBridgeClose) {
        // Dapp close, we need to reset the callback processor
        console.log('ledger-bridge-close', data);
        browserTab = null;
        callbackProcessor.resetCurrentMessageId();

        return;
      }

      // Every message from the ledger iframe will have a messageId that was
      // assigned to it by the callbackProcessor. This messageId is used by the
      // callbackProcessor to trigger the appropriate callback from the
      // initiating request.
      callbackProcessor.processCallback(data);
    }
  });

  // This listener received action messages from the offscreen bridge
  // Then it forwards the message to the live ledger iframe
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: LedgerAction;

        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
        return;
      }

      switch (msg.action) {
        case LedgerAction.makeApp:
          sendResponse({
            success: true,
            payload: {
              result: true,
            },
          });
          return;
        case LedgerAction.updateTransport:
          sendResponse({
            success: true,
            payload: {
              result: true,
            },
          });
          return;
        // For all other actions, forward to the iframe
        default:
          break;
      }

      if (!browserTab) {
        openConnectorTab(BROWSER_TAB_URL);
      }

      const messageId = callbackProcessor.registerCallback(sendResponse);
      // The ledger action constants use the same values as the ledger keyring
      // library expectations. That way we can just forward the message to the
      // iframe and it will be handled by the ledger keyring library. We append
      // the messageId which will be included in the response so that it can be
      // routed accordingly through the callback-processor.
      const iframeMsg = {
        ...msg,
        target: LEDGER_FRAME_TARGET,
        messageId,
      };

      if (browserTab) {
        // This line ensures the tab is focused, but will not be 100% reliable due to browser security policies
        browserTab.focus();
      }
      setTimeout(() => {
        browserTab?.postMessage(iframeMsg, KnownOrigins.ledger);
      }, 500);

      // This keeps sendResponse function valid after return
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
      // eslint-disable-next-line consistent-return
      return true;
    },
  );
}

export default async function init() {
  return new Promise<void>((resolve) => {
    setupMessageListeners();
    resolve();
  });
}

function openConnectorTab(url: string) {
  browserTab = window.open(url);
  if (!browserTab) {
    throw new Error('Failed to open Lattice connector.');
  }
}
