import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  KnownOrigins,
} from '../../shared/constants/offscreen-communication';
import { CallbackProcessor } from './callback-processor';

const LEDGER_FRAME_TARGET = 'LEDGER-IFRAME';
const LEDGER_BRIDGE_URL = 'http://localhost:3000/';

/**
 * The ledger keyring iframe will send this event name when the ledger is
 * connected to the iframe.
 */
const LEDGER_KEYRING_IFRAME_CONNECTED_EVENT = 'ledger-connection-event';

const callbackProcessor = new CallbackProcessor();

function setupMessageListeners(iframe: HTMLIFrameElement) {
  // This listener receives action responses from the live ledger iframe
  // Then forwards the response to the offscreen bridge
  window.addEventListener('message', ({ origin, data, source }) => {
    if (origin !== KnownOrigins.ledger || source !== iframe.contentWindow) {
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
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
        return;
      }

      if (!iframe.contentWindow) {
        const error = new Error('Ledger iframe not present');
        sendResponse({
          success: false,
          payload: {
            error,
          },
        });
        return;
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

      iframe.contentWindow.postMessage(iframeMsg, KnownOrigins.ledger);

      // This keeps sendResponse function valid after return
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
      // eslint-disable-next-line consistent-return
      return true;
    },
  );
}

export default async function init() {
  return new Promise<void>((resolve, reject) => {
    // First check if we can access the bridge URL
    fetch(LEDGER_BRIDGE_URL, { method: 'HEAD' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to access Ledger iframe bridge: ${response.status} ${response.statusText}`,
          );
        }

        // URL is accessible, create and load the iframe
        const iframe = document.createElement('iframe');
        iframe.src = LEDGER_BRIDGE_URL;
        iframe.allow = 'hid';
        iframe.onload = () => {
          setupMessageListeners(iframe);
          console.log('Ledger iframe bridge loaded successfully');
          resolve();
        };

        document.body.appendChild(iframe);
      })
      .catch((error) => {
        // Log the error if we can't access the bridge URL
        console.error('Ledger iframe bridge not accessible:', error.message);

        // Still resolve the promise to not block the application
        reject(new Error(error.message));
      });
  });
}
