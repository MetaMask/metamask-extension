import log from 'loglevel';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import type { Json } from '@metamask/utils';
import getFetchWithTimeout from '../fetch-with-timeout';
import { getManifestFlags } from '../manifestFlags';
import ExtensionStore from './extension-store';
import type { MetaMaskStorageStructure } from './base-store';
import { BrowserStorageAdapter } from './browser-storage-adapter';

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

async function setStorageServiceData(
  storageServiceData: Record<string, unknown>,
): Promise<void> {
  const browserStorageAdapter = new BrowserStorageAdapter();

  for (const [key, value] of Object.entries(storageServiceData)) {
    try {
      const parsedKey = parseStorageServiceFixtureKey(key);
      if (!parsedKey) {
        log.debug(`Ignoring invalid storage service fixture key '${key}'`);
        continue;
      }
      await browserStorageAdapter.setItem(
        parsedKey.namespace,
        parsedKey.key,
        value as Json,
      );
    } catch (error) {
      log.debug(
        `Error writing storage service fixture data key '${key}': '${error instanceof Error ? error.message : String(error)}'`,
      );
    }
  }
}

function parseStorageServiceFixtureKey(
  storageKey: string,
): { namespace: string; key: string } | undefined {
  if (!storageKey.startsWith(STORAGE_KEY_PREFIX)) {
    return undefined;
  }
  const keyWithoutPrefix = storageKey.slice(STORAGE_KEY_PREFIX.length);
  const separatorIndex = keyWithoutPrefix.indexOf(':');
  if (separatorIndex === -1) {
    return undefined;
  }
  const namespace = keyWithoutPrefix.slice(0, separatorIndex);
  const key = keyWithoutPrefix.slice(separatorIndex + 1);
  if (!namespace || !key) {
    return undefined;
  }
  return { namespace, key };
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

        if (state.meta?.storageKind === 'split') {
          // If fixture is already in split state format, convert it properly
          const kvs = new Map(Object.entries(state.data));
          kvs.set('meta', state.meta);
          await super.setKeyValues(kvs);
        } else {
          await super.set(state);
        }

        // Write StorageService entries after the main extension state so fixture
        // state overwrites cannot remove generated StorageService metadata.
        if (Object.keys(state.storageServiceData ?? {}).length > 0) {
          await setStorageServiceData(state.storageServiceData);
        }
      } else {
        log.debug(
          `Received response with a status of ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
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
