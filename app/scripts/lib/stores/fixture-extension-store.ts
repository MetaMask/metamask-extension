import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import ExtensionStore from './extension-store';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

export class FixtureExtensionStore extends ExtensionStore {
  #initialized: boolean = false;

  #initializing?: Promise<void>;

  constructor() {
    super();
    this.#initializing = this.#init();
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
}
