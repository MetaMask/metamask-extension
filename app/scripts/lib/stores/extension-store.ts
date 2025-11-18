import browser from 'webextension-polyfill';
import log from 'loglevel';
import type { MetaMaskStorageStructure, BaseStore } from './base-store';
import { AnyCnameRecord } from 'node:dns';

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
  manifest: any;

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
    debugger;
    const { local } = browser.storage;
    // don't fetch more than we need, incase extra stuff was put in the db
    // by testing or users playing with the db
    const db = await local.get(['manifest']);

    // get all keys from the manifest, and load those keys
    const keys = db.manifest ? Object.keys(db.manifest) : [];
    const storedData = await local.get(keys);
    this.manifest = db.manifest;
    const data = keys.reduce(
      (acc, key) => {
        // @ts-expect-error TODO
        acc[key] = storedData[key];
        return acc;
      },
      {} as MetaMaskStorageStructure['data'],
    ) as any;
    const meta = data.meta;
    delete data.meta;
    if (!meta) {
      return null;
    }
    return {
      meta,
      data,
    };
  }

  async setKeyValues<Key extends keyof MetaMaskStorageStructure['data']>(
    pairs: {
      key: Key;
      value: MetaMaskStorageStructure['data'][Key];
    }[],
    meta: AnyCnameRecord
  ): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    const toSet: Record<string, string> = {
      meta
    };

    for (const { key, value } of pairs) {
      toSet[key] = value;
    }

    // update the manifest
    if (this.manifest) {
      for (const { key } of pairs) {
        this.manifest[key] = true;
      }
      toSet['manifest'] = this.manifest;
    } else {
      const manifest: Record<string, boolean> = {};
      for (const { key } of pairs) {
        manifest[key] = true;
      }
      toSet['manifest'] = manifest;
      this.manifest = manifest;
    }
    this.manifest.meta = true;

    console.log(`Writing ${pairs.length} keys to local store`);
    return await local.set(toSet);
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
