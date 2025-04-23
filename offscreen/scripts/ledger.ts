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

const TAB_URL = 'http://localhost:5173/';

const callbackProcessor = new CallbackProcessor();

// Singleton
let browserTab: Window | null = null;

/**
 * Sets up event listeners for messages coming from the Ledger iframe
 */
function setupResponseListeners(): void {
  // This listener receives action responses from the live ledger iframe
  // Then forwards the response to the offscreen bridge
  window.addEventListener('message', (msg) => {
    // TODO remove those
    const { origin, data, source } = msg;
    console.log('msg', msg);
    console.log('message', origin, data, source);

    // Only handle messages from the ledger iframe
    if (source !== browserTab) {
      return;
    }

    if (data) {
      if (data.action === LEDGER_KEYRING_IFRAME_CONNECTED_EVENT) {
        console.log('ledger-connection-event', data);
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
}

/**
 * Sets up message listeners for commands coming from the extension
 */
function setupMessageSender(): void {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: LedgerAction;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (!msg || msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
        return;
      }

      console.log('msg', msg);
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

      // If browserTab is not open, open it first
      if (!browserTab) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        openConnectorTab(TAB_URL)
          .then((newBrowserTab) => {
            browserTab = newBrowserTab;
            // Handle message after setting browserTab
            handleLedgerMessage(msg, sendResponse);
          })
          .catch((error) => {
            sendResponse({
              success: false,
              payload: {
                error,
              },
            });
          });

        return;
      }

      // If we already have a browserTab, handle the message directly
      handleLedgerMessage(msg, sendResponse);
    },
  );
}

/**
 * Handles Ledger-related messages by either handling them directly or forwarding to the iframe
 *
 * @param msg - The message to handle
 * @param msg.target - The target for the message
 * @param msg.action - The action to perform
 * @param msg.params - The parameters for the action
 * @param sendResponse - The callback function to send the response back
 * @returns A boolean indicating if the message was handled asynchronously
 */
function handleLedgerMessage(
  msg: {
    target: string;
    action: LedgerAction;
    params: Record<string, unknown>;
  },
  sendResponse: (response?: Record<string, unknown>) => void,
): boolean {
  if (!browserTab) {
    const error = new Error('Ledger tab not present');
    sendResponse({
      success: false,
      payload: {
        error,
      },
    });
    return false;
  }

  // Special case handling for known actions
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

  browserTab.postMessage(iframeMsg, KnownOrigins.ledger);

  // This keeps sendResponse function valid after return
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
  return true;
}

/**
 * Opens a connector tab to communicate with the Ledger device
 *
 * @param url - The URL to open in the new tab
 * @returns A promise that resolves to the opened window
 */
async function openConnectorTab(url: string): Promise<Window> {
  const newTab = window.open(url);
  if (!newTab) {
    throw new Error('Failed to open Ledger connector tab.');
  }

  return newTab;
}

/**
 * Initializes the Ledger offscreen script
 */
export default async function init(): Promise<void> {
  return new Promise<void>((resolve) => {
    setupResponseListeners();
    setupMessageSender();
    resolve();
  });
}
