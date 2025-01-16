import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { isEmpty } from 'lodash';
import {
  type IntermediaryStateType,
  MetaMaskStorageStructure,
} from './BaseStore';
import ExtensionStore from './ExtensionStore';
import ReadOnlyNetworkStore from './ReadOnlyNetworkStore';

export class PersistanceManager {
  /**
   * dataPersistenceFailing is a boolean that is set to true if the storage
   * system attempts to write state and the write operation fails. This is only
   * used as a way of deduplicating error reports sent to sentry as it is
   * likely that multiple writes will fail concurrently.
   */
  dataPersistenceFailing: boolean;

  /**
   * mostRecentRetrievedState is a property that holds the most recent state
   * successfully retrieved from memory. Due to the nature of async read
   * operations it is beneficial to have a near real-time snapshot of the state
   * for sending data to sentry as well as other developer tooling.
   */
  mostRecentRetrievedState: MetaMaskStorageStructure | null;

  /**
   * metadata is a property that holds the current metadata object. This object
   * includes a single key which is 'version' and contains the current version
   * number of the state tree. This is only incremented via the migrator and in
   * a well functioning (typical) install should match the latest migration's
   * version number.
   */
  #metadata?: { version: number };

  stateCorruptionDetected: boolean;

  isExtensionInitialized: boolean;

  localStore: ExtensionStore | ReadOnlyNetworkStore;

  constructor({
    localStore,
  }: {
    localStore: ExtensionStore | ReadOnlyNetworkStore;
  }) {
    this.stateCorruptionDetected = false;
    this.dataPersistenceFailing = false;
    this.mostRecentRetrievedState = null;
    this.isExtensionInitialized = false;

    this.localStore = localStore;
  }

  /**
   * Sets the current metadata. The set method that is implemented in storage
   * classes only requires an object that is set on the 'data' key. The
   * metadata key of this class is set on the 'meta' key of the underlying
   * storage implementation (e.g. chrome.storage.local).
   */
  set metadata(metadata: { version: number } | undefined) {
    this.#metadata = metadata;
  }

  /**
   * Gets the current metadata object and returns it. The underlying key is
   * private and implemented in the BaseStore class so that the extending class
   * can access it through this getter.
   */
  get metadata(): { version: number } | undefined {
    return this.#metadata;
  }

  async set(state: IntermediaryStateType) {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    if (!this.#metadata) {
      throw new Error(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    }
    try {
      await this.localStore.set({ data: state, meta: this.#metadata });

      if (this.dataPersistenceFailing) {
        this.dataPersistenceFailing = false;
      }
    } catch (err) {
      if (!this.dataPersistenceFailing) {
        this.dataPersistenceFailing = true;
        captureException(err);
      }
      log.error('error setting state in local store:', err);
    } finally {
      this.isExtensionInitialized = true;
    }
  }

  async get() {
    const result = await this.localStore.get();

    if (isEmpty(result)) {
      this.mostRecentRetrievedState = null;
      return undefined;
    }
    if (!this.isExtensionInitialized) {
      this.mostRecentRetrievedState = result;
    }
    return result;
  }

  cleanUpMostRecentRetrievedState() {
    if (this.mostRecentRetrievedState) {
      this.mostRecentRetrievedState = null;
    }
  }
}
