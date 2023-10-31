import { CallbackProcessor } from './callback-processor';
import { LEDGER_ACTION, LEDGER_EVENT, LEDGER_TARGET } from './constants';

const LEDGER_FRAME_ORIGIN_URL = 'https://metamask.github.io';
const LEDGER_FRAME_TARGET = 'LEDGER-IFRAME';

const callbackProcessor = new CallbackProcessor();

// This listener receives action responses from the live ledger iframe
// Then forwards the response to the offscreen bridge
window.addEventListener('message', ({ origin, data }) => {
  if (origin !== LEDGER_FRAME_ORIGIN_URL) {
    return;
  }

  if (data) {
    if (data.action === LEDGER_EVENT.DEVICE_CONNECT) {
      chrome.runtime.sendMessage({
        action: LEDGER_EVENT.DEVICE_CONNECT,
        payload: data.payload.connected,
      });

      return;
    }

    callbackProcessor.processCallback(data);
  }
});

// This listener received action messages from the offscreen bridge
// Then it forwards the message to the live ledger iframe
chrome.runtime.onMessage.addListener(
  (
    msg: {
      target: string;
      action: (typeof LEDGER_ACTION)[keyof typeof LEDGER_ACTION];
      params: any;
    },
    _sender,
    sendResponse,
  ) => {
    if (msg.target !== LEDGER_TARGET) {
      return;
    }

    const iframe = document.querySelector('iframe');

    if (!iframe?.contentWindow) {
      const error = new Error('Ledger iframe not present');
      sendResponse({
        success: false,
        error,
        payload: {
          error,
        },
      });
    }

    const messageId = callbackProcessor.registerCallback(sendResponse);
    const iframeMsg = {
      ...msg,
      target: LEDGER_FRAME_TARGET,
      messageId,
    };

    // It has already been checked that they are not null
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    iframe!.contentWindow!.postMessage(iframeMsg, '*');

    // This keeps sendResponse function valid after return
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
    // eslint-disable-next-line consistent-return
    return true;
  },
);
