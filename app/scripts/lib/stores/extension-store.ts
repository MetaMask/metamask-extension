import browser from 'webextension-polyfill';
import log from 'loglevel';
import type { MetaMaskStorageStructure, BaseStore } from './base-store';

/**
 * An implementation of the MetaMask Extension BaseStore system that uses the
 * browser.storage.local API to persist and retrieve state.
 */
export default class ExtensionStore implements BaseStore {
  isSupported: boolean;

  constructor() {
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
    // don't fetch more than we need, incase extra stuff was put in the db
    // by testing or users playing with the db
    return await local.get(['data', 'meta']);
  }

  /**
   * Overwrite data in `local` extension storage area
   *
   * @param data - The data to set
   * @param data.data - The MetaMask State tree
   * @param data.meta - The metadata object
   */
  async set({ data, meta }: Required<MetaMaskStorageStructure>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    return await local.set({ data, meta });
  }

  /**
   * Removes 'data' and 'meta' keys and values from  `local` extension storage
   * area.
   */
  async reset(): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    return await local.remove(['data', 'meta']);
  }
}
