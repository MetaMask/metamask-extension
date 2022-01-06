import log from 'loglevel';
import { SECOND } from '../../../shared/constants/time';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

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
   * @returns {Promise<object>}
   */
  async get() {
    if (!this._initialized) {
      await this._initializing;
    }
    return this._state;
  }

  /**
   * Set state
   * @param {Object} state - The state to set
   * @returns {Promise<void>}
   */
  async set(state) {
    if (!this._initialized) {
      await this._initializing;
    }
    this._state = state;
  }
}
