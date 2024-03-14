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
import { getPreferencesControllerErrorState } from './utils';

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
   * In the following case state will **NOT** be persisted but without an error
   * 1. The stateCorruptionDetected flag is true and the user has not opted into
   * restoring from backup. This is to avoid persisting corrupted state which
   * can potentially overwrite a user's state file in the extension filesystem
   * that has been lost by the browser's internal pointer to the file being
   * broken.
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
      return await this.generateFirstTimeState();
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
      const result = await this.#get();
      // extension.storage.local always returns an obj
      // if the object is empty, treat it as undefined
      if (!result?.data) {
        this.mostRecentRetrievedState = null;
        // If the data is missing, and we have no record of it ever existing,
        // then return undefined so that it can be treated as a fresh install
        // clear state tree.
        if (this.hasStateExisted === false) {
          return await this.generateFirstTimeState();
        }
        this.stateCorruptionDetected = true;

        global.sentry?.captureMessage('Empty/corrupted vault found');

        // If the data is missing, but we have a record of it existing at some
        // point return an empty object, return the fallback state tree from
        return await this.#generateCorruptedStateTreeFallback();
      }
      // If the data isn't missing, set a key in localStorage to let us know
      // that at some point we had a persisted state tree for this user and
      // install.
      if (this.hasStateExisted === false) {
        this.recordStateExistence();
      }
      if (!this.isExtensionInitialized) {
        this.mostRecentRetrievedState = result;
      }
      return result;
    } catch (err) {
      this.stateCorruptionDetected = true;
      global.sentry?.captureException(err);
      // If we get an error trying to read the state, this indicated some kind
      // of corruption or fault of the storage mechanism and we should fallback
      // to the process for handling corrupted state.
      return await this.#generateCorruptedStateTreeFallback();
    }
  }

  /**
   * This method is called when a state corruption is detected and will return
   * a state tree that achieves one of two possible outcomes:
   * 1. If the user has opted into restoring from backup, the vault will be
   * added to the KeyringController state from localStorage. We also set the
   * firstTimeFlowType to 'restore' so that the user is redirected to the
   * correct screen of the Onboarding experience, skipping the Welcome screen.
   * If the user's vault was not backed up in localStorage, we set state to the
   * default shape for a new user.
   * 2. If the user has not opted into restoring from backup, we set a flag in
   * the PreferencesController state to show an error screen in the UI. This
   * error screen displays a button that, when clicked, sets a flag in
   * localStorage that will result in the first option above being taken.
   *
   * @returns
   */
  async #generateCorruptedStateTreeFallback(): Promise<
    Required<MetaMaskStorageStructure>
  > {
    // We persist the vault to localStorage as a failsafe in the event state
    // corruption occurs.
    const _keyringVault = global.localStorage.getItem('metaMaskVault');
    const keyringVault = _keyringVault ? JSON.parse(_keyringVault) : null;
    // unable to recover, clear state
    const versionedData = await this.generateFirstTimeState();
    if (this.hasUserOptedIntoRestart) {
      //  When we get to this point we pull it out of
      // localStorage and use it to at least allow the user to recover their
      // accounts and backup their seed phrase. The rest of their settings will
      // be wiped and returned to default. For the sake of transparency we will
      // show an error screen to the user informing them what happened and that
      // their settings are defaulted. The 'restoredFromBackup' flag is used to
      // show this error screen in ui.js. Once they restart the app the flag is
      // reverted to bypass the error screen.
      if (keyringVault) {
        versionedData.data.KeyringController = {
          // Restore the vault from localstorage
          vault: keyringVault,
          // Set a flag to indicate that the vault was restored from backup
          restoredFromBackup: true,
        };
        // We have to set the completedOnboarding flag to true to avoid an
        // Infinite routing loop where after unlocking they are redirected back
        // to an unlock screen on the onboarding flow.
        versionedData.data.OnboardingController = {
          completedOnboarding: true, // Will change this to firstTimeFlowType: FirstTimeFlowType.restore soon
        };
      }
      // Remove the OPTED_IN flag so that if the corruption were to happen
      // again the user would not be automatically restored from the backup
      // but would rather be presented with the options again.
      this.hasUserOptedIntoRestart = false;
      // We set the stateCorruptionDetected flag to false so that the new state
      // tree can be persisted. The set method throws an error if this flag is
      // true.
      this.stateCorruptionDetected = false;
    } else {
      // We set some initializationFlags in the preferences controller here so
      // that ui.js may interpret them and display an error.
      versionedData.data.PreferencesController =
        getPreferencesControllerErrorState(keyringVault);
      sentry?.captureMessage(
        'MetaMask - Empty vault found - unable to recover',
      );
    }
    return versionedData;
  }

  async isFirstTimeInstall(): Promise<boolean> {
    const result = await this.#get();
    return isEmpty(result) && this.hasStateExisted === false;
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
  async #get(): Promise<MetaMaskStorageStructure> {
    const { local } = browser.storage;
    const result = await local.get(null);
    const err = checkForLastError();
    if (err) {
      throw err;
    }
    return result as MetaMaskStorageStructure;
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
   async #set(obj: {
     data: IntermediaryStateType;
     meta: { version: number };
   }): Promise<void> {
     const { local } = browser.storage;
     await local.set(obj);
     const err = checkForLastError();
     if (err) {
       throw err;
     }
   }
}
