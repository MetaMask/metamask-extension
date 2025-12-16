import log from 'loglevel';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import ExtensionStore from './extension-store';
import type { MetaMaskStorageStructure } from './base-store';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

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

  async #init() {
    try {
      const response = await fetchWithTimeout(FIXTURE_SERVER_URL);

      if (response.ok) {
        const state = await response.json();
        await super.set(state);
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
