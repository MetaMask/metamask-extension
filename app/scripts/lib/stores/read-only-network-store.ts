import log from 'loglevel';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import type {
  MetaMaskStateType,
  BaseStore,
  MetaMaskStorageStructure,
} from './base-store';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

/**
 * A read-only network-based storage wrapper
 */
export default class ReadOnlyNetworkStore implements BaseStore {
  #initialized: boolean = false;

  #initializing?: Promise<void>;

  #state: MetaMaskStateType | null = null;

  constructor() {
    this.#initializing = this.#init();
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
      const response = await fetchWithTimeout(FIXTURE_SERVER_URL);

      if (response.ok) {
        this.#state = await response.json();
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

  /**
   * Returns state
   */
  async get() {
    if (!this.#initialized) {
      await this.#initializing;
    }
    return this.#state;
  }

  /**
   * Overwrite in-memory copy of state.
   *
   * @param data - The data to set
   */
  async set(data: Required<MetaMaskStorageStructure>): Promise<void> {
    if (!data) {
      throw new Error('MetaMask - updated state is missing');
    }
    if (!this.#initialized) {
      await this.#initializing;
    }
    this.#state = data;
  }

  /**
   * Resets data to its initial state.
   */
  async reset(): Promise<void> {
    this.#initialized = false;
    this.#state = null;
    this.#initializing = this.#init();
    await this.#initializing;
  }
}
