import {
  ONEKEY_HARDWARE_UI_EVENT,
  OneKeyBridge,
} from '@metamask/eth-onekey-keyring';
import type {
  Params,
  Response as OneKeyResponse,
  EVMSignedTx,
  EVMSignTransactionParams,
  EVMSignMessageParams,
  EVMSignTypedDataParams,
} from '@onekeyfe/hd-core';
import type { EthereumMessageSignature } from '@onekeyfe/hd-transport';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  OneKeyAction,
} from '../../../../shared/constants/offscreen-communication';

/**
 * This class is used as a custom bridge for the OneKey connection. Every
 * hardware wallet keyring also requires a bridge that has a known interface
 * that the keyring can call into for specific functions. The bridge then makes
 * whatever calls or requests it needs to in order to fulfill the request from
 * the keyring. In this case, the bridge is used to communicate with the
 * Offscreen Document. Inside the Offscreen document the onekey script is
 * loaded and registers a listener for these calls and communicate with the
 * onekey/hd-web-sdk library.
 */
export class OneKeyOffscreenBridge implements OneKeyBridge {
  model: string | undefined;

  private listeners: Map<string, (payload: unknown) => void> = new Map();

  on(event: string, listener: (payload: unknown) => void) {
    this.listeners.set(event, listener);
  }

  off(event: string) {
    if (!this.listeners.has(event)) {
      return;
    }
    this.listeners.delete(event);
  }

  init() {
    chrome.runtime.onMessage.addListener((msg) => {
      if (
        msg.target === OffscreenCommunicationTarget.extension &&
        msg.event === OffscreenCommunicationEvents.onekeyDeviceConnect
      ) {
        this.model = msg.payload.model;
      } else if (
        msg.target === OffscreenCommunicationTarget.extension &&
        msg.event === OffscreenCommunicationEvents.onekeyDeviceConnectError
      ) {
        const listener = this.listeners.get(ONEKEY_HARDWARE_UI_EVENT);
        if (listener) {
          listener(msg.payload);
        }
      }
    });

    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.init,
          params: {
            env: window.navigator.usb ? 'webusb' : 'web',
          },
        },
        () => {
          resolve();
        },
      );
    });
  }

  dispose() {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.dispose,
        },
        () => {
          resolve();
        },
      );
    });
  }

  updateTransportMethod(transportType: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.switchTransport,
          params: { transportType },
        },
        () => {
          resolve();
        },
      );
    });
  }

  getPublicKey(params: { path: string; coin: string }) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.getPublicKey,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as OneKeyResponse<{ publicKey: string; chainCode: string }>;
  }

  getPassphraseState() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.getPassphraseState,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as OneKeyResponse<string | undefined>;
  }

  ethereumSignTransaction(params: Params<EVMSignTransactionParams>) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.signTransaction,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as OneKeyResponse<EVMSignedTx>;
  }

  ethereumSignMessage(params: Params<EVMSignMessageParams>) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.signMessage,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as OneKeyResponse<EthereumMessageSignature>;
  }

  ethereumSignTypedData(params: Params<EVMSignTypedDataParams>) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.onekeyOffscreen,
          action: OneKeyAction.signTypedData,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as OneKeyResponse<EthereumMessageSignature>;
  }
}
