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
    log.info('[ExtensionStore.get] Attempting browser.storage.local.get...');
    try {
      const result = await local.get(['data', 'meta']);
      log.info('[ExtensionStore.get] Success', {
        hasData: !!result?.data,
        hasMeta: !!result?.meta,
        dataKeys: result?.data ? Object.keys(result.data).slice(0, 5) : [],
      });
      return result;
    } catch (error) {
      log.error('[ExtensionStore.get] browser.storage.local.get failed:', error);
      if (browser.runtime.lastError) {
        log.error('[ExtensionStore.get] lastError:', browser.runtime.lastError);
      }
      throw error;
    }
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

    log.info('[ExtensionStore.set] Attempting browser.storage.local.set...');
    try {
      const result = await local.set({ data, meta });
      log.info('[ExtensionStore.set] Success');
      return result;
    } catch (error) {
      log.error('[ExtensionStore.set] browser.storage.local.set failed:', error);
      // Try to get more details about the error
      if (browser.runtime.lastError) {
        log.error('[ExtensionStore.set] lastError:', browser.runtime.lastError);
      }
      throw error;
    }
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
