import type {
  EthereumSignMessage,
  EthereumSignTransaction,
  Params,
  EthereumSignTypedDataTypes,
  ConnectSettings,
  Manifest,
  EthereumSignedTx,
  PROTO,
  EthereumSignTypedHash,
} from '@trezor/connect-web';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../../../shared/constants/offscreen-communication';
import { TrezorResponse, TrezorBridgeInterface } from './types';

type TrezorMessage = {
  target: OffscreenCommunicationTarget;
  event: OffscreenCommunicationEvents;
  payload?: unknown;
};

/**
 * This class is used as a custom bridge for the Trezor connection. Every
 * hardware wallet keyring also requires a bridge that has a known interface
 * that the keyring can call into for specific functions. The bridge then makes
 * whatever calls or requests it needs to in order to fulfill the request from
 * the keyring. In this case, the bridge is used to communicate with the
 * Offscreen Document. Inside the Offscreen document the trezor script is
 * loaded and registers a listener for these calls and communicate with the
 * trezor/connect-web library.
 */
export class TrezorOffscreenBridge implements TrezorBridgeInterface {
  model: string | undefined;

  init(
    settings: {
      manifest: Manifest;
    } & Partial<ConnectSettings>,
  ) {
    chrome.runtime.onMessage.addListener(
      (msg: TrezorMessage & { payload?: string }) => {
        if (
          msg.target === OffscreenCommunicationTarget.extension &&
          msg.event === OffscreenCommunicationEvents.trezorDeviceConnect
        ) {
          this.model = msg.payload;
        }
      },
    );

    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.init,
          params: settings,
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
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.dispose,
        },
        () => {
          resolve();
        },
      );
    });
  }

  getPublicKey(
    params: Params<{ path: string; coin: string }>,
  ): Promise<{ publicKey: string; chainCode: string }> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.getPublicKey,
          params,
        },
        (response: TrezorResponse) => {
          if (response.success && response.payload) {
            resolve(
              response.payload as { publicKey: string; chainCode: string },
            );
          } else {
            reject(new Error(response.error || 'Unknown error occurred'));
          }
        },
      );
    });
  }

  ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
  ): Promise<EthereumSignedTx> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.signTransaction,
          params,
        },
        (response: TrezorResponse) => {
          if (response.success && response.payload) {
            resolve(response.payload as EthereumSignedTx);
          } else {
            reject(new Error(response.error || 'Unknown error occurred'));
          }
        },
      );
    });
  }

  ethereumSignMessage(
    params: Params<EthereumSignMessage>,
  ): Promise<{ address: string; signature: string }> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.signMessage,
          params,
        },
        (response: TrezorResponse) => {
          if (response.success && response.payload) {
            const { address, signature } =
              response.payload as PROTO.MessageSignature;
            resolve({ address, signature });
          } else {
            reject(new Error(response.error || 'Unknown error occurred'));
          }
        },
      );
    });
  }

  ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
  ): Promise<PROTO.EthereumTypedDataSignature> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.signTypedData,
          params,
        },
        (response: TrezorResponse) => {
          if (response.success && response.payload) {
            resolve(response.payload as PROTO.EthereumTypedDataSignature);
          } else {
            reject(new Error(response.error || 'Unknown error occurred'));
          }
        },
      );
    });
  }
}
