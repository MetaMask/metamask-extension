import browser from 'webextension-polyfill';
import { awaitOffscreenDocumentCreation } from '../../offscreen';
import { OffscreenCommunicationTarget } from '../../../../shared/constants/offscreen-communication';
import { isOffscreenAvailable } from '../../../../shared/modules/mv3.utils';
import {
  BaseStore,
  MetaMaskStorageStructure,
  IntermediaryStateType,
} from './BaseStore';

const isLocalStorageAvailable = window.localStorage;

const browserRuntimeSendMessageToAwait = async (params: {
  target: string;
  action: string;
  key?: string;
  state?: IntermediaryStateType;
}): Promise<Record<string, unknown>> => {
  await awaitOffscreenDocumentCreation();
  return new Promise((resolve, reject) => {
    browser.runtime
      .sendMessage(undefined, params)
      .then((response: { error?: Error; value: Record<string, unknown> }) => {
        if (response.error) {
          reject(response.error);
        }
        resolve(response.value);
      });
  });
};

export class LocalStorageWithOffScreenStore extends BaseStore {
  isSupported: boolean;

  constructor() {
    super();

    this.isSupported = Boolean(isOffscreenAvailable || isLocalStorageAvailable);
    if (!this.isSupported) {
      throw new Error('Local storage and offscreen are not supported');
    }
  }

  async get(): Promise<MetaMaskStorageStructure | null> {
    if (isOffscreenAvailable) {
      await awaitOffscreenDocumentCreation();
      return (await browserRuntimeSendMessageToAwait({
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'getItem',
      })) as MetaMaskStorageStructure;
    } else if (isLocalStorageAvailable) {
      const value = window.localStorage.getItem('state');
      return value ? JSON.parse(value) : null;
    }
    return null;
  }

  async set(state: IntermediaryStateType): Promise<void> {
    if (isOffscreenAvailable) {
      await browserRuntimeSendMessageToAwait({
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'setItem',
        key: 'state',
        state,
      });
    } else {
      window.localStorage.setItem('state', JSON.stringify(state));
    }
  }
}
