import browser from 'webextension-polyfill';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { checkForLastError } from '../../../../shared/modules/browser-runtime.utils';
import type Migrator from '../migrator';
import {
  type IntermediaryStateType,
  BaseStore,
  MetaMaskStorageStructure,
  EmptyState,
} from './BaseStore';

const { sentry } = global;

/**
 * Returns whether or not the given object contains no keys
 *
 * @param obj - The object to check
 * @returns
 */
function isEmpty(
  obj: MetaMaskStorageStructure | EmptyState,
): obj is EmptyState {
  return Object.keys(obj).length === 0;
}

/**
 * An implementation of the MetaMask Extension BaseStore system that uses the
 * browser.storage.local API to persist and retrieve state.
 */
export class ExtensionStore extends BaseStore {
  isSupported: boolean;

  stateCorruptionDetected: boolean;

  dataPersistenceFailing: boolean;

  isExtensionInitialized: boolean;

  mostRecentRetrievedState: MetaMaskStorageStructure | null;

  migrator: Migrator;

  constructor({ migrator }: { migrator: Migrator }) {
    super();
    this.stateCorruptionDetected = false;
    this.isSupported = Boolean(browser.storage.local);
    if (!this.isSupported) {
      log.error('Storage local API not available.');
    }
    // we use this flag to avoid flooding sentry with a ton of errors:
    // once data persistence fails once and it flips true we don't send further
    // data persistence errors to sentry
    this.dataPersistenceFailing = false;
    this.mostRecentRetrievedState = null;
    this.isExtensionInitialized = false;
    this.migrator = migrator;
  }

  /**
   * Persists the MetaMask state tree on the 'data' key of the
   * browser.storage.local API. This function will first do some sanity checks
   * to determine if it is likely for the operation to succeed. It will throw
   * an error in the following cases.
   * 1. The browser does not support the browser.storage.local API.
   * 2. No state object was provided to the function. As more of the codebase
   * is migrated to TypeScript, this should become less of a possibility but
   * never impossible.
   * 3. The metadata property is not set on the class which is required before
   * setting state. This ensures the 'meta' key of the storage is set.
   *
   * @param state - The state to persist to the data key of the local store
   * @returns void
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
    try {
      // we format the data for storage as an object with the "data" key for the controller state object
      // and the "meta" key for a metadata object containing a version number that tracks how the data shape
      // has changed using migrations to adapt to backwards incompatible changes
      await this.#set({ data: state, meta: this.metadata });
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

  /**
   * Returns all of the keys currently saved
   */
  async get() {
    /**
     * If chrome.storage.local is not available, return the default state tree
     * which will not be persisted. This should probably be a bug that we
     * report to sentry.
     *
     */
    if (!this.isSupported) {
      return this.generateFirstTimeState();
    }
    try {
       const result = await this.#get();
      // extension.storage.local always returns an obj
      // if the object is empty, treat it as undefined
      if (!result?.data) {
        this.mostRecentRetrievedState = null;
        this.stateCorruptionDetected = true;

        sentry.captureMessage('Empty/corrupted vault found');

        // If the data is missing, but we have a record of it existing at some
        // point return an empty object, return the fallback state tree from
        return this.generateFirstTimeState();
      }
      if (!this.isExtensionInitialized) {
        this.mostRecentRetrievedState = result;
      }
      return result;
    } catch (err) {
      this.stateCorruptionDetected = true;
      log.error('error getting state from local store:', err);
      // If we get an error trying to read the state, this indicated some kind
      // of corruption or fault of the storage mechanism and we should fallback
      // to the process for handling corrupted state.
      return this.generateFirstTimeState();
    }
  }

  async isFirstTimeInstall(): Promise<boolean> {
    const result = await this.#get();
    if (isEmpty(result)) {
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
   * Returns all of the keys currently saved
   *
   * @private
   * @returns the key-value map from local storage
   */
  #get(): Promise<MetaMaskStorageStructure> {
    const { local } = browser.storage;
    return new Promise((resolve, reject) => {
      local
        .get(null)
        .then((result) => {
          const err = checkForLastError();
          if (err) {
            reject(err);
          } else {
            resolve(result as MetaMaskStorageStructure);
          }
        })
        // Because local.get can fail, we need to catch the error and  reject
        // it so we can deal with the error higher in the application logic.
        .catch((e) => reject(e));
    });
  }

  /**
   * Sets the key in local state
   *
   * @param obj - The key to set
   * @param obj.data - The MetaMask State tree
   * @param obj.meta - The metadata object
   * @param obj.meta.version - The version of the state tree determined by the
   * migration
   * @returns a promise resolving to undefined.
   * @private
   */
  #set(obj: {
    data: IntermediaryStateType;
    meta: { version: number };
  }): Promise<void> {
    const { local } = browser.storage;
    return new Promise((resolve, reject) => {
      local
        .set(obj)
        .then(() => {
          const err = checkForLastError();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
        .catch((e) => reject(e));
    });
  }
}
