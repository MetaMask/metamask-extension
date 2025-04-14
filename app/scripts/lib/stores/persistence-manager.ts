import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { isEmpty } from 'lodash';
import { type MetaMaskStateType, MetaMaskStorageStructure } from './base-store';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExtensionStore from './extension-store';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ReadOnlyNetworkStore from './read-only-network-store';

/**
 * The PersistenceManager class serves as a high-level manager for handling
 * storage-related operations using a local storage system. It provides methods to read
 * and write state, manage metadata, and handle errors or corruption in the
 * underlying storage system.
 *
 * Key Responsibilities:
 *
 * 1. **State Management:**
 * - Tracks the most recently retrieved state
 * - reads state from the storage system
 * - writes updated state to the storage system
 *
 * 2. **Metadata Handling:**
 * - Manages a `metadata` object containing versioning information for the
 * state tree. The version is used to ensure consistency and proper
 * handling of migrations.
 *
 * 3. **Error Management:**
 * - Tracks whether data persistence is failing and logs appropriate errors
 * - Captures exceptions during write operations and reports them using
 * Sentry
 *
 *
 * Usage:
 * The `PersistenceManager` is instantiated with a `localStore`, which is an
 * implementation of the `BaseStore` class (either `ExtensionStore` or
 * `ReadOnlyNetworkStore`). It provides methods for setting and retrieving
 * state, managing metadata, and handling cleanup tasks.
 */
export class PersistenceManager {
  /**
   * dataPersistenceFailing is a boolean that is set to true if the storage
   * system attempts to write state and the write operation fails. This is only
   * used as a way of deduplicating error reports sent to sentry as it is
   * likely that multiple writes will fail concurrently.
   */
  #dataPersistenceFailing: boolean = false;

  /**
   * mostRecentRetrievedState is a property that holds the most recent state
   * successfully retrieved from memory. Due to the nature of async read
   * operations it is beneficial to have a near real-time snapshot of the state
   * for sending data to sentry as well as other developer tooling.
   */
  #mostRecentRetrievedState: MetaMaskStorageStructure | null = null;

  /**
   * metadata is a property that holds the current metadata object. This object
   * includes a single key which is 'version' and contains the current version
   * number of the state tree.
   */
  #metadata?: { version: number };

  #isExtensionInitialized: boolean = false;

  readonly #localStore: ExtensionStore | ReadOnlyNetworkStore;

  constructor({
    localStore,
  }: {
    localStore: ExtensionStore | ReadOnlyNetworkStore;
  }) {
    this.#localStore = localStore;
  }

  setMetadata(metadata: { version: number }) {
    this.#metadata = metadata;
  }

  async set(state: MetaMaskStateType) {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    if (!this.#metadata) {
      throw new Error('MetaMask - metadata must be set before calling "set"');
    }
    try {
      await this.#localStore.set({ data: state, meta: this.#metadata });
      if (this.#dataPersistenceFailing) {
        this.#dataPersistenceFailing = false;
      }
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
    } catch (err) {
      if (!this.#dataPersistenceFailing) {
        this.#dataPersistenceFailing = true;
        captureException(err);
      }
      log.error('error setting state in local store:', err);
    } finally {
      this.#isExtensionInitialized = true;
    }
  }

  async get() {
    const result = await this.#localStore.get();

    if (isEmpty(result)) {
      this.#mostRecentRetrievedState = null;
      return undefined;
    }
    if (!this.#isExtensionInitialized) {
      this.#mostRecentRetrievedState = result;
    }
    return result;
  }

  get mostRecentRetrievedState() {
    return this.#mostRecentRetrievedState;
  }

  cleanUpMostRecentRetrievedState() {
    if (this.#mostRecentRetrievedState) {
      this.#mostRecentRetrievedState = null;
    }
  }
}
