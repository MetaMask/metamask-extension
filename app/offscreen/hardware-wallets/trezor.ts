import TrezorConnectSDK, { DEVICE, DEVICE_EVENT } from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../../shared/constants/offscreen-communication';

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
          // `@trezor/connect-web`'s SDK is a singleton that lives for the
          // lifetime of the offscreen document, independent of the background
          // keyring it serves. When the keyring is recreated (e.g. the user
          // cancels the connect flow and starts it again) `init` runs a second
          // time while the previous core (iframe or Suite Desktop) is still
          // mounted, and `CoreInIframe.init` throws `Init_AlreadyInitialized`.
          // That would leave `sendResponse` uncalled and hang MetaMask on
          // "Looking for your Trezor" state. Disposing first tears down any stale
          // connection so each request re-opens a fresh one. The core mode is
          // intentionally left to the SDK's default ('auto') / caller-provided
          // setting so users can connect through Trezor Suite Desktop or the
          // remote iframe.
          Promise.resolve()
            .then(() => TrezorConnectSDK.dispose())
            .catch(() => undefined)
            .then(() => {
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

              return TrezorConnectSDK.init({
                ...msg.params,
                env: 'webextension',
              });
            })
            .then(() => sendResponse())
            // Resolve the bridge even if init fails so it does not hang; the
            // subsequent call surfaces the real error to the UI.
            .catch(() => sendResponse());

          break;

        case TrezorAction.dispose:
          // This removes the Trezor Connect iframe from the DOM
          // This method is not well documented, but the code it calls can be seen
          // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
          TrezorConnectSDK.dispose();

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

        case TrezorAction.cancel:
          // Cancels any in-flight Trezor Connect call (e.g. a getPublicKey that
          // is hanging while the device is locked). This settles the pending
          // promise so the keyring operation that holds the KeyringController
          // mutex can unwind and release it.
          TrezorConnectSDK.cancel();

          sendResponse();

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
      return true;
    },
  );
}
