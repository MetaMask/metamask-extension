import log from 'loglevel';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

/**
 * A read-only network-based storage wrapper
 */
export default class ReadOnlyNetworkStore {
  constructor() {
    this._initialized = false;
    this._initializing = this._init();
    this._state = undefined;
    this.mostRecentRetrievedState = null;
  }

  /**
   * Declares this store as compatible with the current browser
   */
  isSupported = true;

  /**
   * Initializes by loading state from the network
   */
  async _init() {
    try {
      const response = await fetchWithTimeout(FIXTURE_SERVER_URL);
      if (response.ok) {
        this._state = await response.json();
      }
    } catch (error) {
      log.debug(`Error loading network state: '${error.message}'`);
    } finally {
      this._initialized = true;
    }
  }

  /**
   * Returns state
   *
   * @returns {Promise<object>}
   */
  async get() {
    if (!this._initialized) {
      await this._initializing;
    }
    // Delay setting this until after the first read, to match the
    // behavior of the local store.
    if (!this.mostRecentRetrievedState) {
      this.mostRecentRetrievedState = this._state;
    }
    return this._state;
  }

  /**
   * Set metadata/version state
   *
   * @param {object} metadata - The metadata/version data to set
   */
  setMetadata(metadata) {
    this.metadata = metadata;
  }

  /**
   * Set state
   *
   * @param {object} state - The state to set
   */
  async set(state) {
    if (!this.isSupported) {
      throw new Error(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    }
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    if (!this.metadata) {
      throw new Error(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    }
    if (!this._initialized) {
      await this._initializing;
    }
    this._state = { data: state, meta: this._metadata };
  }
}
