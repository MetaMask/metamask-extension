import log from 'loglevel';
import { isErrorWithMessage } from '@metamask/utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import type Migrator from '../migrator';
import { type IntermediaryStateType, BaseStore } from './BaseStore';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

/**
 * A read-only network-based storage wrapper
 */
export default class ReadOnlyNetworkStore extends BaseStore {
  #initialized: boolean;

  #promiseToInitialize?: Promise<void>;

  #state: IntermediaryStateType | null;

  mostRecentRetrievedState: IntermediaryStateType | null;

  stateCorruptionDetected: boolean;

  dataPersistenceFailing: boolean;

  migrator: Migrator;

  firstTimeInstall: boolean;

  constructor({ migrator }: { migrator: Migrator }) {
    super();
    this.#initialized = false;
    this.#promiseToInitialize = this.#init();
    this.#state = null;
    this.mostRecentRetrievedState = null;
    this.stateCorruptionDetected = false;
    this.dataPersistenceFailing = false;
    this.migrator = migrator;
    this.firstTimeInstall = false;
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
      if (isErrorWithMessage(error)) {
        log.debug(`Error loading network state: '${error.message}'`);
      } else {
        log.debug(`Unknown error loading network state`);
      }
    } finally {
      this.#initialized = true;
    }
  }

  async isFirstTimeInstall(): Promise<boolean> {
    const result = await this.get();
    if (result === null) {
      return true;
    }
    return false;
  }

  cleanUpMostRecentRetrievedState() {
    if (this.mostRecentRetrievedState) {
      this.mostRecentRetrievedState = null;
    }
  }

  /**
   * Returns state
   */
  async get() {
    if (!this.#initialized) {
      await this.#promiseToInitialize;
    }
    // Delay setting this until after the first read, to match the
    // behavior of the local store.
    if (!this.mostRecentRetrievedState && this.#state?.data) {
      this.mostRecentRetrievedState = this.#state;
    }
    return this.#state?.data ? this.#state : this.generateFirstTimeState();
  }

  /**
   * Set state
   *
   * @param state - The state to set
   */
  async set(state: IntermediaryStateType) {
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
    if (!this.#initialized) {
      await this.#promiseToInitialize;
    }
    this.#state = { data: state, meta: this.metadata };
  }
}
