import {
  ConnectSettings,
  CoreApi,
  DEVICE,
  UI_REQUEST,
  UI_RESPONSE,
  UiEvent,
  Unsuccessful,
} from '@onekeyfe/hd-core';
import { HardwareErrorCode } from '@onekeyfe/hd-shared';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  OneKeyAction,
} from '../../shared/constants/offscreen-communication';

/**
 * This listener is used to listen for messages targeting the OneKey Offscreen
 * handler. Each package sent has an action that is used to determine what calls
 * to the OneKey Hardware SDK should be made. The response is then sent back to
 * the sender of the message, which in this case will be the
 * OneKeyOffscreenBridge.
 */
let isSDKInitialized = false;
let sdk: CoreApi | undefined;

function handleBlockErrorEvent(payload: Unsuccessful) {
  const { code } = payload.payload;
  const errorCodes: number[] = [
    HardwareErrorCode.WebDeviceNotFoundOrNeedsPermission,
    HardwareErrorCode.BridgeNotInstalled,
    HardwareErrorCode.NewFirmwareForceUpdate,
    HardwareErrorCode.NotAllowInBootloaderMode,
    HardwareErrorCode.CallMethodNeedUpgradeFirmware,
    HardwareErrorCode.DeviceCheckPassphraseStateError,
    HardwareErrorCode.DeviceCheckUnlockTypeError,
    HardwareErrorCode.SelectDevice,
  ];

  if (code && typeof code === 'number' && errorCodes.includes(code)) {
    chrome.runtime.sendMessage({
      target: OffscreenCommunicationTarget.extension,
      event: OffscreenCommunicationEvents.onekeyDeviceConnectError,
      payload: payload.payload,
    });
  }
}

export default function init() {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: OneKeyAction;
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.onekeyOffscreen) {
        return;
      }

      switch (msg.action) {
        case OneKeyAction.init:
          // eslint-disable-next-line no-case-declarations
          const {
            HardwareWebSdk,
            HardwareSDKLowLevel,
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
          } = require('@onekeyfe/hd-web-sdk');

          // eslint-disable-next-line no-case-declarations
          const settings: Partial<ConnectSettings> = {
            debug: true,
            fetchConfig: false,
            connectSrc: 'https://jssdk.onekey.so/1.1.5/',
            env: msg.params.env,
          };

          try {
            if (isSDKInitialized) {
              sendResponse();
              return;
            }

            HardwareWebSdk.init(settings, HardwareSDKLowLevel).then(() => {
              isSDKInitialized = true;
              sdk = HardwareWebSdk;

              sdk?.on('DEVICE_EVENT', (event) => {
                if (event.type !== DEVICE.CONNECT) {
                  return;
                }
                const { features } = event.payload;
                const modelName =
                  features?.onekey_device_type ||
                  features?.ble_name ||
                  features?.label;

                if (modelName) {
                  chrome.runtime.sendMessage({
                    target: OffscreenCommunicationTarget.extension,
                    event: OffscreenCommunicationEvents.onekeyDeviceConnect,
                    payload: {
                      model: modelName,
                    },
                  });
                }
              });
              sdk?.on('UI_EVENT', (e) => {
                const originEvent = e as UiEvent;
                if (originEvent.type === UI_REQUEST.REQUEST_PIN) {
                  sdk?.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PIN,
                    payload: '@@ONEKEY_INPUT_PIN_IN_DEVICE',
                  });
                }
                if (originEvent.type === UI_REQUEST.REQUEST_PASSPHRASE) {
                  sdk?.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                    payload: {
                      value: '',
                      passphraseOnDevice: true,
                      save: false,
                    },
                  });
                }
              });

              sendResponse();
            });
          } catch (error) {
            isSDKInitialized = false;
          }
          break;

        case OneKeyAction.dispose:
          // This removes the Trezor Connect iframe from the DOM
          // This method is not well documented, but the code it calls can be seen
          // here: https://github.com/trezor/connect/blob/dec4a56af8a65a6059fb5f63fa3c6690d2c37e00/src/js/iframe/builder.js#L181
          sdk?.removeAllListeners('DEVICE_EVENT');
          sdk?.removeAllListeners('UI_EVENT');
          sdk?.dispose();
          isSDKInitialized = false;
          sdk = undefined;

          sendResponse();
          break;

        case OneKeyAction.getPublicKey:
          sdk
            ?.evmGetPublicKey('', '', {
              ...msg.params,
              showOnOneKey: false,
            })
            .then((result) => {
              let response;
              if (result?.success) {
                response = {
                  success: true,
                  payload: {
                    publicKey: result.payload.pub,
                    chainCode: result.payload.node.chain_code,
                  },
                };
              } else {
                handleBlockErrorEvent(result);
                response = {
                  success: false,
                  payload: {
                    error: result?.payload.error ?? '',
                    code:
                      typeof result?.payload?.code === 'number'
                        ? result?.payload?.code
                        : undefined,
                  },
                };
              }

              sendResponse(response);
            });
          break;

        case OneKeyAction.getPassphraseState:
          sdk?.getPassphraseState().then((result) => {
            if (!result?.success) {
              handleBlockErrorEvent(result);
            }
            sendResponse(result);
          });
          break;

        case OneKeyAction.signTransaction:
          sdk?.evmSignTransaction('', '', msg.params).then((result) => {
            if (!result?.success) {
              handleBlockErrorEvent(result);
            }
            sendResponse(result);
          });

          break;

        case OneKeyAction.signMessage:
          sdk?.evmSignMessage('', '', msg.params).then((result) => {
            if (!result?.success) {
              handleBlockErrorEvent(result);
            }
            sendResponse(result);
          });

          break;

        case OneKeyAction.signTypedData:
          sdk?.evmSignTypedData('', '', msg.params).then((result) => {
            if (!result?.success) {
              handleBlockErrorEvent(result);
            }
            sendResponse(result);
          });

          break;

        default:
          sendResponse({
            success: false,
            payload: {
              error: 'OneKey action not supported',
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
