import { KeystoneBridge } from '@keystonehq/metamask-keystone-usb-keyring';
import {
  KeystoneAction,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';

const KEYSTONE_URL = "/home.html#keystone-usb-bridge"

export class KeystoneOffscreenBridge implements KeystoneBridge {

  init(mfp?: string) {

    return new Promise<void>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.keystoneOffscreen,
          action: KeystoneAction.init,
          params: { url: KEYSTONE_URL, mfp },
        },
        (response) => {
          console.log('KeystoneOffscreenBridge init resolved', response);
          if (response.error) {
            reject(response.error);
            return;
          }
          resolve();
        },
      );
    });
  }

  getKeys(paths: string[]) {
    console.log('KeystoneOffscreenBridge getKeys', paths);
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.keystoneOffscreen,
          action: KeystoneAction.getKeys,
          params: { paths },
        },
        (response) => {
          console.log('KeystoneOffscreenBridge getKeys response', response);
          resolve(response.payload);
        },
      );
    }) as Promise<{
      keys: {
        publicKey: string;
        chainCode?: string;
        address: string;
        xpub: string;
        path: string;
      }[];
      mfp: string;
    }>;
  }

  signTransaction(path: string, rawTx: string, isLegacyTx?: boolean) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.keystoneOffscreen,
          action: KeystoneAction.signTransaction,
          params: { path, rawTx, isLegacyTx },
        },
        (response) => {
          resolve(response.payload);
        },
      );
    }) as Promise<{
      r: string;
      s: string;
      v: string;
    }>;
  }

  signPersonalMessage(path: string, message: string) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.keystoneOffscreen,
          action: KeystoneAction.signPersonalMessage,
          params: { path, message },
        },
        (response) => {
          resolve(response.payload);
        },
      );
    }) as Promise<{
      r: string;
      s: string;
      v: string;
    }>;
  }

  signEIP712Message(path: string, jsonMessage: unknown) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.keystoneOffscreen,
          action: KeystoneAction.signEIP712Message,
          params: { path, jsonMessage },
        },
        (response) => {
          resolve(response.payload);
        },
      );
    }) as Promise<{
      r: string;
      s: string;
      v: string;
    }>;
  }
}
