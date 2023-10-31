import TrezorConnectSDK, { DEVICE, DEVICE_EVENT } from '@trezor/connect-web';
import { TREZOR_ACTION, TREZOR_EVENT, TREZOR_TARGET } from './constants';

chrome.runtime.onMessage.addListener(
  (
    msg: {
      target: string;
      action: typeof TREZOR_ACTION[keyof typeof TREZOR_ACTION];
      params: any;
    },
    _sender,
    sendResponse,
  ) => {
    if (msg.target !== TREZOR_TARGET) {
      return;
    }

    switch (msg.action) {
      case TREZOR_ACTION.INIT:
        TrezorConnectSDK.on(DEVICE_EVENT, (event) => {
          if (event.type !== DEVICE.CONNECT) {
            return;
          }

          if (event.payload.features?.model) {
            chrome.runtime.sendMessage({
              event: TREZOR_EVENT.DEVICE_CONNECT,
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

      case TREZOR_ACTION.DISPOSE:
        // This removes the Trezor Connect iframe from the DOM
        // This method is not well documented, but the code it calls can be seen
        // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
        TrezorConnectSDK.dispose();

        sendResponse();

        break;

      case TREZOR_ACTION.GET_PUBLIC_KEY:
        TrezorConnectSDK.getPublicKey(msg.params).then((result) => {
          sendResponse(result);
        });

        break;

      case TREZOR_ACTION.SIGN_TRANSACTION:
        TrezorConnectSDK.ethereumSignTransaction(msg.params).then((result) => {
          sendResponse(result);
        });

        break;

      case TREZOR_ACTION.SIGN_MESSAGE:
        TrezorConnectSDK.ethereumSignMessage(msg.params).then((result) => {
          sendResponse(result);
        });

        break;

      case TREZOR_ACTION.SIGN_TYPED_DATA:
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
