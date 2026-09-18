import log from 'loglevel';
import browser from 'webextension-polyfill';
import getFetchWithTimeout from '../fetch-with-timeout';
import { getManifestFlags } from '../manifestFlags';
import { PLATFORM_FIREFOX } from '../../constants/app';
import { getBrowserName } from '../browser-runtime.utils';
import ExtensionStore from './extension-store';
import type { MetaMaskStorageStructure } from './base-store';
import {
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from './indexeddb-storage-constants';
import { IndexedDBStore } from './indexeddb-store';

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const DEFAULT_FIXTURE_SERVER_PORT = 12345;

function resolveFixtureServerPort(): number {
  try {
    const flags = getManifestFlags();
    const port = flags.testing?.fixtureServerPort;

    if (typeof port === 'number' && port > 0 && port <= 65535) {
      return port;
    }
  } catch {
    // Defense-in-depth for early extension/service-worker initialization.
  }

  return DEFAULT_FIXTURE_SERVER_PORT;
}

function getFixtureServerUrl(): string {
  return `http://${FIXTURE_SERVER_HOST}:${resolveFixtureServerPort()}/state.json`;
}

/**
 * Seed StorageService fixture entries into IndexedDB, falling back to browser
 * storage when IndexedDB mutations are blocked.
 *
 * @param storageServiceData - StorageService entries keyed by their full storage key.
 */
async function setStorageServiceData(
  storageServiceData: Record<string, unknown>,
): Promise<void> {
  const database = new IndexedDBStore();

  if (isFirefox) {
    // we don't use IndexedDB on Firefox as storage.local does have the same
    // reliability concerns as chromium, additionally, Firefox has modes that
    // might block IndexedDB access entirely, so we just don't even bother with
    // it at all.
    await browser.storage.local.set(storageServiceData);
    return;
  }

  await database.open(
    STORAGE_SERVICE_INDEXED_DB_NAME,
    STORAGE_SERVICE_INDEXED_DB_VERSION,
  );
  await database.set(storageServiceData);
}

/**
 * Derived class of ExtensionStore that initializes the store using the fixture server.
 */
export class FixtureExtensionStore extends ExtensionStore {
  #initialized: boolean = false;

  #initializing?: Promise<void>;

  /**
   * Construct a FixtureExtensionStore.
   *
   * If the `initialize` argument is `false`, the store is assumed to be initialized already.
   *
   * @param args - Arguments
   * @param args.initialize - Whether to initialize the store by reading and setting fixtures.
   */
  constructor({ initialize = false }: { initialize?: boolean } = {}) {
    super();

    if (initialize) {
      this.#initializing = this.#init();
    } else {
      this.#initializing = Promise.resolve();
      this.#initialized = true;
    }
  }

  /**
   * Sets multiple key-value pairs in the state object.
   * Only works if the state is an object.
   *
   * @param pairs - Map of key-value pairs to set
   */
  async setKeyValues(pairs: Map<string, unknown>): Promise<void> {
    if (!this.#initialized) {
      await this.#initializing;
    }
    return super.setKeyValues(pairs);
  }

  /**
   * Declares this store as compatible with the current browser
   */
  isSupported = true;

  /**
   * Initializes by loading state from the network
   */
  async #init() {
    try {
      const response = await fetchWithTimeout(getFixtureServerUrl());

      if (response.ok) {
        const state = await response.json();

        // Write StorageService entries to its backing store so controllers can
        // read them outside the main extension state.
        if (Object.keys(state.storageServiceData ?? {}).length > 0) {
          await setStorageServiceData(state.storageServiceData);
        }

        if (state.meta?.storageKind === 'split') {
          // If fixture is already in split state format, convert it properly
          const kvs = new Map(Object.entries(state.data));
          kvs.set('meta', state.meta);
          await super.setKeyValues(kvs);
        } else {
          await super.set(state);
        }
      } else {
        log.debug(
          `Received response with a status of ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.log('error', error);
      if (error instanceof Error) {
        log.debug(`Error loading network state: '${error.message}'`);
      } else {
        log.debug(`Error loading network state: An unknown error occurred`);
      }
    } finally {
      this.#initialized = true;
    }
  }

  async get(): Promise<MetaMaskStorageStructure | null> {
    if (!this.#initialized) {
      await this.#initializing;
    }
    return super.get();
  }

  async set(data: Required<MetaMaskStorageStructure>): Promise<void> {
    if (!this.#initialized) {
      await this.#initializing;
    }
    return super.set(data);
  }

  async reset(): Promise<void> {
    this.#initialized = false;
    await super.reset();
    this.#initializing = this.#init();
    await this.#initializing;
  }
}
