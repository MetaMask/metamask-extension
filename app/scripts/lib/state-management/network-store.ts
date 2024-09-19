import log from 'loglevel';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

/**
 * A read-only network-based storage wrapper
 */
export default class ReadOnlyNetworkStore {
  private _initialized: boolean;

  private _initializing: Promise<void>;

  public _state: Record<string, unknown> | undefined;

  public mostRecentRetrievedState: Record<string, unknown> | null;

  public metadata?: object;

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
   *
   * @private
   */
  private async _init(): Promise<void> {
    try {
      const response = await fetchWithTimeout(FIXTURE_SERVER_URL);
      if (response.ok) {
        this._state = await response.json();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.debug(`Error loading network state: '${error.message}'`);
      }
    } finally {
      this._initialized = true;
    }
  }

  /**
   * Returns the current state
   *
   * @returns A promise that resolves to the current state.
   */
  async get(): Promise<Record<string, unknown> | undefined> {
    if (!this._initialized) {
      await this._initializing;
    }

    // Delay setting this until after the first read
    if (!this.mostRecentRetrievedState) {
      this.mostRecentRetrievedState = this._state ?? null;
    }

    return this._state;
  }

  /**
   * Sets metadata/version data
   *
   * @param metadata - The metadata to set
   */
  setMetadata(metadata: object): void {
    this.metadata = metadata;
  }

  /**
   * Sets the state directly in memory
   *
   * @param state - The state to set
   */
  async set(state: Record<string, unknown>): Promise<void> {
    if (!this.isSupported) {
      throw new Error(
        'MetaMask - cannot persist state to local store as this browser does not support this action',
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

    this._state = { data: state, meta: this.metadata };
  }

  /**
   * Clears the most recent retrieved state
   */
  cleanUpMostRecentRetrievedState(): void {
    if (this.mostRecentRetrievedState) {
      this.mostRecentRetrievedState = null;
    }
  }
}
