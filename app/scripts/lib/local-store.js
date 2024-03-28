import browser from 'webextension-polyfill';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { checkForLastError } from '../../../shared/modules/browser-runtime.utils';

/**
 * A wrapper around the extension's storage local API
 */
export default class ExtensionStore {
  constructor() {
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
  }

  setMetadata(initMetaData) {
    this.metadata = initMetaData;
  }

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
    if (
      this.stateCorruptionDetected &&
      window.localStorage.getItem('USER_OPTED_IN_TO_RESTORE') !== 'true'
    ) {
      log.info(
        'State Corruption was detected and user has not opted into recovery so skipping state update',
      );
      return;
    }
    try {
      // we format the data for storage as an object with the "data" key for the controller state object
      // and the "meta" key for a metadata object containing a version number that tracks how the data shape
      // has changed using migrations to adapt to backwards incompatible changes
      await this._set({ data: state, meta: this.metadata });
      if (this.dataPersistenceFailing) {
        this.dataPersistenceFailing = false;
      }
    } catch (err) {
      if (!this.dataPersistenceFailing) {
        this.dataPersistenceFailing = true;
        captureException(err);
      }
      log.error('error setting state in local store:', err);
    }
  }

  /**
   * Returns all of the keys currently saved
   *
   * @returns {Promise<*>}
   */
  async get() {
    if (!this.isSupported) {
      return undefined;
    }
    // State can become corrupted on firefox which seems to be most commonly
    // caused by a broken link between the sqlite entry for the extension and
    // the name of the file that stores the data. Some users have been able to
    // restore the functionality by finding and fixing the reference but until
    // then the extension presents as an infinite spinner loader. To avoid this
    // we can return undefined if we get an error loading state. This will make
    // Firefox behave the same way that Chrome does when state is missing which
    // is to load the default state and drop into the onboarding flow.
    try {
      const result = await this._get();
      // extension.storage.local always returns an obj
      // if the object is empty, treat it as undefined
      if (isEmpty(result)) {
        this.mostRecentRetrievedState = null;
        // If the data is missing, and we have no record of it ever existing,
        // then return undefined so that it can be treated as a fresh install
        // clear state tree.
        if (window.localStorage.getItem('MMStateExisted') === null) {
          return undefined;
        }
        this.stateCorruptionDetected = true;
        // If the data is missing, but we have a record of it existing at some
        // point return an empty object, which will trigger the state
        // corruption handler in background.js.
        return {};
      }
      // If the data isn't missing, set a key in localStorage to let us know
      // that at some point we had a persisted state tree for this user and
      // install.
      if (window.localStorage.getItem('MMStateExisted') === null) {
        window.localStorage.setItem('MMStateExisted', Date.now());
      }
      this.mostRecentRetrievedState = result;
      return result;
    } catch (err) {
      this.stateCorruptionDetected = true;
      log.error('error getting state from local store:', err);
      // If we get an error trying to read the state, this indicated some kind
      // of corruption or fault of the storage mechanism and we should show the
      // user the error screen for data corruption.
      return {};
    }
  }

  /**
   * Returns all of the keys currently saved
   *
   * @private
   * @returns {object} the key-value map from local storage
   */
  _get() {
    const { local } = browser.storage;
    return new Promise((resolve, reject) => {
      local
        .get(null)
        .then((/** @type {any} */ result) => {
          const err = checkForLastError();
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        })
        // Because local.get can fail, we need to catch the error and  reject
        // it so we can deal with the error higher in the applciation logic.
        .catch((e) => reject(e));
    });
  }

  /**
   * Sets the key in local state
   *
   * @param {object} obj - The key to set
   * @returns {Promise<void>}
   * @private
   */
  _set(obj) {
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

/**
 * Returns whether or not the given object contains no keys
 *
 * @param {object} obj - The object to check
 * @returns {boolean}
 */
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
