import browser from 'webextension-polyfill';
import log from 'loglevel';
import {
  type MetaMaskStateType,
  type MetaMaskStorageStructure,
  BaseStore,
} from './base-store';

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
   * Return all data in `local` extension storage area.
   *
   * @returns All data stored`local` extension storage area.
   */
  async get(): Promise<MetaMaskStorageStructure | null> {
    if (!this.isSupported) {
      log.error('Storage local API not available.');
      return null;
    }
    const { local } = browser.storage;
    return await local.get(null);
  }

  /**
   * Overwrite data in `local` extension storage area
   *
   * @param obj - The data to set
   * @param obj.data - The MetaMask State tree
   * @param obj.meta - The metadata object
   * @param obj.meta.version - The version of the state tree determined by the
   * migration
   */
  async set(obj: {
    data: MetaMaskStateType;
    meta: { version: number };
  }): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    return await local.set(obj);
  }
}
