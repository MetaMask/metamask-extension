import { Length } from './../../ui/components/component-library/sensitive-text/sensitive-text.stories';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  KnownOrigins,
} from '../../shared/constants/offscreen-communication';
import { CallbackProcessor } from './callback-processor';
import { throws } from 'assert';

const LEDGER_FRAME_TARGET = 'LEDGER-IFRAME';

/**
 * The ledger keyring iframe will send this event name when the ledger is
 * connected to the iframe.
 */
const LEDGER_KEYRING_IFRAME_CONNECTED_EVENT = 'ledger-connection-event';

const callbackProcessor = new CallbackProcessor();

const BROWSER_TAB_URL = 'http://localhost:5173/';

let browserTab: Window | null = null;
let isBrowserTabOnline = false;

// Queue to store messages when browserTab is not online
const messageQueue: {
  message: unknown;
  origin: string;
}[] = [];

function setupMessageListeners() {
  // This listener receives action responses from the live ledger iframe
  // Then forwards the response to the offscreen bridge
  window.addEventListener('message', (msg) => {
    const { data, source } = msg;

    if (source !== browserTab) {
      return;
    }

    if (data) {
      // Handle heartbeat response
      if (
        data.action === 'heartbeat-response' &&
        data.payload &&
        data.payload.online === true
      ) {
        console.log('Browser tab is online');
        isBrowserTabOnline = true;

        // Process any queued messages
        processMessageQueue();
        return;
      }

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
        isBrowserTabOnline = false;
        if (callbackProcessor.messageCallbacks.size > 0) {
          callbackProcessor.throwCloseAppError();
          callbackProcessor.resetCurrentMessageId();
        }

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

        // Send heartbeat check
        sendHeartbeat();

        // If browserTab is online, send message immediately
        if (isBrowserTabOnline) {
          browserTab.postMessage(iframeMsg, KnownOrigins.ledger);
        } else {
          // Otherwise, queue the message and wait for online status
          messageQueue.push({
            message: iframeMsg,
            origin: KnownOrigins.ledger,
          });

          // If we've queued a message, set a fallback timeout in case we never get the heartbeat
          setTimeout(() => {
            if (!isBrowserTabOnline && browserTab) {
              console.log(
                'Fallback: Sending message after timeout without online confirmation',
              );
              browserTab.postMessage(iframeMsg, KnownOrigins.ledger);
            }
          }, 1000);
        }
      }

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

/**
 * Sends a heartbeat message to check if the browser tab is online
 */
function sendHeartbeat() {
  if (browserTab) {
    console.log('Sending heartbeat message');
    browserTab.postMessage(
      {
        target: LEDGER_FRAME_TARGET,
        action: 'heartbeat-check',
        params: {},
      },
      KnownOrigins.ledger,
    );
  }
}

/**
 * Process any queued messages when the browser tab comes online
 */
function processMessageQueue() {
  if (isBrowserTabOnline && browserTab && messageQueue.length > 0) {
    console.log(`Processing ${messageQueue.length} queued messages`);

    while (messageQueue.length > 0) {
      const queuedMessage = messageQueue.shift();
      if (queuedMessage) {
        browserTab.postMessage(queuedMessage.message, queuedMessage.origin);
      }
    }
  }
}

function openConnectorTab(url: string) {
  browserTab = window.open(url);
  if (!browserTab) {
    throw new Error('Failed to open Lattice connector.');
  }

  // Reset online status when opening a new tab
  isBrowserTabOnline = false;

  // Start heartbeat checks
  sendHeartbeat();

  // Set up periodic heartbeat checks
  const heartbeatInterval = setInterval(() => {
    if (browserTab) {
      sendHeartbeat();
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 1000); // Check every 1 seconds
}
