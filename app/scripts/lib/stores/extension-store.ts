import browser from 'webextension-polyfill';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import type {
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';

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

  #manifest: Set<string> = new Set();

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
    console.time('[ExtensionStore] Reading from local store');
    // don't fetch more than we need, incase extra stuff was put in the db
    // by testing or users playing with the db
    const response = await local.get(['manifest']);
    if (
      isObject(response) &&
      hasProperty(response, 'manifest') &&
      Array.isArray(response.manifest)
    ) {
      const keys = response.manifest;

      // get all keys from the manifest, and load those keys
      const data = await local.get(keys);
      this.#manifest = new Set(keys);
      const { meta } = data;
      delete data.meta;
      console.timeEnd('[ExtensionStore] Reading from local store');
      return {
        data,
        meta: meta as unknown as MetaData,
      };
    }

    // don't fetch more than we need, in case extra stuff was put in the db
    // by testing or users playing with the db
    const solidResponse = await local.get(['data', 'meta']);
    if (isObject(solidResponse)) {
      for (const key of Object.keys(solidResponse)) {
        // we loop because we don't always have all the keys (like on a brand new
        // install and sometimes due to apparent state corruption)
        this.#manifest.add(key);
      }
    }
    console.timeEnd('[ExtensionStore] Reading from local store');
    return solidResponse;
  }

  async setKeyValues(pairs: Map<string, unknown>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }

    const { local } = browser.storage;
    const toSet: Record<string, unknown> = Object.create(null);
    const toRemove: string[] = [];
    let updateManifest = false;
    for (const [key, value] of pairs) {
      const keyExists = this.#manifest.has(key);
      const isRemoving = typeof value === 'undefined';
      if (isRemoving) {
        if (!keyExists) {
          log.warn(
            '[ExtensionStore] Trying to remove a key that does not exist in manifest:',
            key,
          );
          continue;
        }
        this.#manifest.delete(key);
        updateManifest = true;
        toRemove.push(key);
        continue;
      }
      if (!keyExists) {
        this.#manifest.add(key);
        updateManifest = true;
      }
      toSet[key] = value;
    }

    if (updateManifest) {
      toSet.manifest = Array.from(this.#manifest);
    }
    console.time('[ExtensionStore] Writing to local store');
    log.info(
      `[ExtensionStore] Writing ${Object.keys(toSet).length} keys to local store`,
    );
    await local.set(toSet);
    log.info(
      `[ExtensionStore] Removing ${toRemove.length} keys from local store`,
    );
    await local.remove(toRemove);
    console.timeEnd('[ExtensionStore] Writing to local store');
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
    console.time('[ExtensionStore] Overwriting local store');
    await local.set({ data, meta });
    console.timeEnd('[ExtensionStore] Overwriting local store');
  }

  /**
   * Removes all keys contained in the manifest from the `local` extension
   * storage area.
   */
  async reset(): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    const { local } = browser.storage;
    return await local.remove([...this.#manifest.keys()]);
  }
}
