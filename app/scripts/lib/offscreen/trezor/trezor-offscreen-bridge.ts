import { TrezorBridge } from 'eth-trezor-keyring';
import type {
  EthereumSignMessage,
  EthereumSignTransaction,
  Params,
  EthereumSignTypedDataTypes,
  ConnectSettings,
  Manifest,
  Response as TrezorResponse,
  EthereumSignedTx,
  PROTO,
  EthereumSignTypedHash,
} from '@trezor/connect-web';
import { TREZOR_ACTION, TREZOR_EVENT, TREZOR_TARGET } from './constants';

export class TrezorOffscreenBridge implements TrezorBridge {
  model: string | undefined;

  init(
    settings: {
      manifest: Manifest;
    } & Partial<ConnectSettings>,
  ) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.event === TREZOR_EVENT.DEVICE_CONNECT) {
        this.model = msg.payload;
      }
    });

    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: TREZOR_TARGET,
          action: TREZOR_ACTION.INIT,
          params: settings,
        },
        (response) => {
          resolve(response);
        },
      );
    });
  }

  dispose() {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: TREZOR_TARGET,
          action: TREZOR_ACTION.DISPOSE,
        },
        (response) => {
          resolve(response);
        },
      );
    });
  }

  getPublicKey(params: { path: string; coin: string }) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: TREZOR_TARGET,
          action: TREZOR_ACTION.GET_PUBLIC_KEY,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as TrezorResponse<{ publicKey: string; chainCode: string }>;
  }

  ethereumSignTransaction(params: Params<EthereumSignTransaction>) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: TREZOR_TARGET,
          action: TREZOR_ACTION.SIGN_TRANSACTION,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as TrezorResponse<EthereumSignedTx>;
  }

  ethereumSignMessage(params: Params<EthereumSignMessage>) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: TREZOR_TARGET,
          action: TREZOR_ACTION.SIGN_MESSAGE,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as TrezorResponse<PROTO.MessageSignature>;
  }

  ethereumSignTypedData(
    params: Params<EthereumSignTypedHash<EthereumSignTypedDataTypes>>,
  ) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: TREZOR_TARGET,
          action: TREZOR_ACTION.SIGN_TYPED_DATA,
          params,
        },
        (response) => {
          resolve(response);
        },
      );
    }) as TrezorResponse<PROTO.MessageSignature>;
  }
}
