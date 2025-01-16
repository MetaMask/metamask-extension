import browser from 'webextension-polyfill';
import log from 'loglevel';
import { checkForLastError } from '../../../../shared/modules/browser-runtime.utils';
import {
  type IntermediaryStateType,
  MetaMaskStorageStructure,
  BaseStore,
} from './BaseStore';

/**
 * An implementation of the MetaMask Extension BaseStore system that uses the
 * browser.storage.local API to persist and retrieve state.
 */
export default class ExtensionStore extends BaseStore {
  isSupported: boolean;

  constructor() {
    super();
    this.isSupported = Boolean(browser.storage.local);
    if (!this.isSupported) {
      log.error('Storage local API not available.');
    }
  }

  /**
   * Returns all of the keys currently saved
   *
   * @returns the key-value map from local storage
   */
  async get(): Promise<MetaMaskStorageStructure | null> {
    if (!this.isSupported) {
      log.error('Storage local API not available.');
      return null;
    }
    const { local } = browser.storage;
    const result = await local.get(null);
    const err = checkForLastError();
    if (err) {
      throw err;
    }
    return result;
  }

  /**
   * Sets the key in local state
   *
   * @param obj - The key to set
   * @param obj.data - The MetaMask State tree
   * @param obj.meta - The metadata object
   * @param obj.meta.version - The version of the state tree determined by the
   * migration
   * @returns a promise resolving to undefined.
   */
  async set(obj: {
    data: IntermediaryStateType;
    meta: { version: number };
  }): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    await local.set(obj);
    const err = checkForLastError();
    if (err) {
      throw err;
    }
  }
}
