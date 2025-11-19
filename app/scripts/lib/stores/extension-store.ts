import browser from 'webextension-polyfill';
import log from 'loglevel';
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

  manifest: Set<string> = new Set();

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
    const keys = ((await local.get('manifest')) as undefined | string[]) ?? [];

    // get all keys from the manifest, and load those keys
    const data = await local.get(keys);
    this.manifest = new Set(keys);
    const { meta } = data;
    if (!meta) {
      return null;
    }
    delete data.meta;
    return {
      meta: meta as unknown as MetaData,
      data,
    };
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
      const keyExists = this.manifest.has(key);
      const isRemoving = typeof value === 'undefined';
      if (isRemoving) {
        if (!keyExists) {
          console.warn(
            '[ExtensionStore] Trying to remove a key that does not exist in manifest:',
            key,
          );
          continue;
        }
        this.manifest.delete(key);
        updateManifest = true;
        toRemove.push(key);
        continue;
      }
      if (!keyExists) {
        this.manifest.add(key);
        updateManifest = true;
      }
      toSet[key] = value;
    }

    if (updateManifest) {
      toSet.manifest = Array.from(this.manifest);
    }

    console.log(
      `[ExtensionStore] Writing ${Object.keys(toSet).length} keys to local store`,
    );
    await local.set(toSet);
    console.log(
      `[ExtensionStore] Removing ${toRemove.length} keys from local store`,
    );
    await local.remove(toRemove);
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
