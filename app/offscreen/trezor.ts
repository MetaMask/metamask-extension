import TrezorConnectSDK, { DEVICE, DEVICE_EVENT } from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../shared/constants/offscreen-communication';

let trezorInitialized = false;
let trezorInitInProgress: Promise<void> | null = null;
let trezorDeviceListenerRegistered = false;

function registerTrezorDeviceListener() {
  if (trezorDeviceListenerRegistered) {
    return;
  }

  TrezorConnectSDK.on(DEVICE_EVENT, (event) => {
    if (event.type !== DEVICE.CONNECT) {
      return;
    }

    if (event.payload.features?.model) {
      chrome.runtime.sendMessage({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.trezorDeviceConnect,
        payload: {
          model: event.payload.features.model,
          minorVersion: event.payload.features.minor_version,
        },
      });
    }
  });

  trezorDeviceListenerRegistered = true;
}

async function initializeTrezorConnect(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
) {
  if (trezorInitialized) {
    return;
  }

  if (trezorInitInProgress) {
    await trezorInitInProgress;
    return;
  }

  registerTrezorDeviceListener();

  trezorInitInProgress = TrezorConnectSDK.init({
    ...params,
    env: 'webextension',
  }).then(() => {
    trezorInitialized = true;
  });

  try {
    await trezorInitInProgress;
  } finally {
    trezorInitInProgress = null;
  }
}

/**
 * This listener is used to listen for messages targeting the Trezor Offscreen
 * handler. Each package sent has an action that is used to determine what calls
 * to the Trezor Connect SDK should be made. The response is then sent back to
 * the sender of the message, which in this case will be the
 * TrezorOffscreenBridge.
 */
export default function init() {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: TrezorAction;

        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.trezorOffscreen) {
        return;
      }

      switch (msg.action) {
        case TrezorAction.init:
          initializeTrezorConnect(msg.params)
            .then(() => {
              sendResponse();
            })
            .catch((error) => {
              sendResponse({
                success: false,
                payload: {
                  error: error instanceof Error ? error.message : String(error),
                },
              });
            });

          break;

        case TrezorAction.dispose:
          // This removes the Trezor Connect iframe from the DOM
          // This method is not well documented, but the code it calls can be seen
          // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
          TrezorConnectSDK.dispose();
          trezorInitialized = false;
          trezorInitInProgress = null;

          sendResponse();

          break;

        case TrezorAction.getPublicKey:
          TrezorConnectSDK.getPublicKey(msg.params).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.signTransaction:
          TrezorConnectSDK.ethereumSignTransaction(msg.params).then(
            (result) => {
              sendResponse(result);
            },
          );

          break;

        case TrezorAction.signMessage:
          TrezorConnectSDK.ethereumSignMessage(msg.params).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.signTypedData:
          TrezorConnectSDK.ethereumSignTypedData(msg.params).then((result) => {
            sendResponse(result);
          });

          break;

        case TrezorAction.getFeatures:
          TrezorConnectSDK.getFeatures().then((result) => {
            sendResponse(result);
          });

          break;

        default:
          sendResponse({
            success: false,
            payload: {
              error: 'Trezor action not supported',
            },
          });
      }

      // This keeps sendResponse function valid after return
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
      // eslint-disable-next-line consistent-return
      return true;
    },
  );
}
