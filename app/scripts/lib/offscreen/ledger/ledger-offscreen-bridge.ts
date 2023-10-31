import { LedgerBridge } from '@metamask/eth-ledger-bridge-keyring';
import { LEDGER_ACTION, LEDGER_EVENT, LEDGER_TARGET } from './constants';

export class LedgerOffscreenBridge implements LedgerBridge {
  isDeviceConnected = false;

  init() {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.event === LEDGER_EVENT.DEVICE_CONNECT) {
        this.isDeviceConnected = msg.payload;
      }
    });

    return Promise.resolve();
  }

  destroy() {
    // TODO: remove listener
    return Promise.resolve();
  }

  attemptMakeApp() {
    return new Promise<boolean>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: LEDGER_TARGET,
          action: LEDGER_ACTION.MAKE_APP,
        },
        (response) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(response.error);
          }
        },
      );
    });
  }

  updateTransportMethod(transportType: string) {
    console.log('updateTransportMethod', transportType);
    return new Promise<boolean>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: LEDGER_TARGET,
          action: LEDGER_ACTION.UPDATE_TRANSPORT,
          params: { transportType },
        },
        (response) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(new Error('Ledger transport could not be updated'));
          }
        },
      );
    });
  }

  getPublicKey(params: { hdPath: string }) {
    return new Promise<{
      publicKey: string;
      address: string;
      chainCode?: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: LEDGER_TARGET,
          action: LEDGER_ACTION.UNLOCK,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }

  deviceSignTransaction(params: { hdPath: string; tx: string }) {
    return new Promise<{
      v: string;
      s: string;
      r: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: LEDGER_TARGET,
          action: LEDGER_ACTION.SIGN_TRANSACTION,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }

  deviceSignMessage(params: { hdPath: string; message: string }) {
    return new Promise<{
      v: number;
      s: string;
      r: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: LEDGER_TARGET,
          action: LEDGER_ACTION.SIGN_MESSAGE,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }

  deviceSignTypedData(params: {
    hdPath: string;
    domainSeparatorHex: string;
    hashStructMessageHex: string;
  }) {
    return new Promise<{
      v: number;
      s: string;
      r: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: LEDGER_TARGET,
          action: LEDGER_ACTION.SIGN_TYPED_DATA,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }
}
