import TrezorConnectSDK, { DEVICE, DEVICE_EVENT } from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../shared/constants/offscreen-communication';

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
          TrezorConnectSDK.on(DEVICE_EVENT, (event) => {
            if (event.type !== DEVICE.CONNECT) {
              return;
            }

            if (event.payload.features?.model) {
              chrome.runtime.sendMessage({
                target: OffscreenCommunicationTarget.extension,
                event: OffscreenCommunicationEvents.trezorDeviceConnect,
                payload: event.payload.features.model,
              });
            }
          });

          TrezorConnectSDK.init({
            ...msg.params,
            env: 'web',
          }).then(() => {
            sendResponse();
          });

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
