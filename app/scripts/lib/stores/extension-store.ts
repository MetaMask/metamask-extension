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

  manifest: MetaMaskStorageStructure['manifest'] | undefined;

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
    const db = await local.get(['manifest']);
    debugger;
    // get all keys from the manifest, and load those keys
    const keys = db.manifest ? Object.keys(db.manifest) : [];
    const storedData = await local.get(keys);
    this.manifest = db.manifest;
    const data = keys.reduce(
      (acc, key) => {
        // @ts-expect-error TODO
        acc[key] = storedData[key] ? JSON.parse(storedData[key]) : undefined;
        return acc;
      },
      {} as MetaMaskStorageStructure['data'],
    );
    const meta = data.meta;
    delete data.meta;
    if (!meta) {
      return null;
    }
    return {
      meta,
      data: keys.reduce(
        (acc, key) => {
          // @ts-expect-error TODO
          acc[key] = storedData[key] ? JSON.parse(storedData[key]) : undefined;
          return acc;
        },
        {} as MetaMaskStorageStructure['data'],
      ),
    };
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
    const oldManifest = this.manifest || {};
    const manifest = {};
    const values = { ...data, meta };
    // for each key in data, JSON stringify it, hash it, and store the hash in the manifest
    const newData = { manifest };
    if (values) {
      for (const key of Object.keys(values)) {
        // @ts-expect-error TODO
        const value = values[key];
        const json = JSON.stringify(value);
        if (!json) {
          console.log('Skipping empty value for key', key);
          // no change, skip
          continue;
        }
        //@ts-expect-error TODO
        manifest[key] = hash;
        const hash = this.hash(json);
        if (oldManifest[key] === hash) {
          console.log('Skipping unchanged value for key', key);
          // no change, skip
          continue;
        }
        //@ts-expect-error TODO
        newData[key] = json;
      }
    }
    this.manifest = manifest;
    const { local } = browser.storage;
    return await local.set(newData);
  }

  hash(str: string) {
    // fnv1a hash, good enough for detecting if a string has changed
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0; // 32-bit FNV prime
    }
    return hash >>> 0; // unsigned int
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
