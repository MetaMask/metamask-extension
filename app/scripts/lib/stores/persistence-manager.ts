import log from 'loglevel';
import browser from 'webextension-polyfill';
import { captureException } from '@sentry/browser';
import { isEmpty } from 'lodash';
import {
  KeyringControllerState,
} from '@metamask/keyring-controller';
import { AppStateControllerState } from '../../controllers/app-state-controller';
import { type MetaMaskStateType, MetaMaskStorageStructure } from './base-store';
import ExtensionStore from './extension-store';
import IndexDBStore from './IndexedDBStore';
import LocalStorageWithOffScreenStore from './LocalStorageWithOffScreenStore';
import ReadOnlyNetworkStore from './read-only-network-store';
import OnboardingController from '../../controllers/onboarding';
import { PreferencesController } from '@metamask/preferences-controller';

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

  #localStore: ExtensionStore | ReadOnlyNetworkStore;

  #vaultReference: string | null;

  #backupStores: Array<IndexDBStore | LocalStorageWithOffScreenStore>;

  constructor({
    localStore,
    backupStores = [],
  }: {
    localStore: ExtensionStore | ReadOnlyNetworkStore;
    backupStores: Array<IndexDBStore | LocalStorageWithOffScreenStore>;
  }) {
    this.#localStore = localStore;
    this.#vaultReference = null;
    this.#backupStores = backupStores;
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
      const keyringController = state.KeyringController as KeyringControllerState;
      const newVaultReference = keyringController?.vault ?? null;
      if (newVaultReference !== this.#vaultReference) {
        if (newVaultReference && this.#vaultReference === null) {
          browser.storage.local.remove('vaultHasNotYetBeenCreated');
        }
        this.backupVault(state);
        this.#vaultReference = newVaultReference;
      }
      if (this.#dataPersistenceFailing) {
        this.#dataPersistenceFailing = false;
      }
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

  backupVault(state: MetaMaskStateType) {
    for(let store of this.#backupStores) {
      store.set({ data: {
        KeyringController: state.KeyringController,
        OnboardingController: state.OnboardingController,
        PreferencesController: state.PreferencesController,
        AppStateController: state.AppStateController,
      }});
    }
  }

  async restoreVaultFromBackup() {
    if (!this.#metadata) {
      throw new Error('MetaMask - metadata must be set restoring vault');
    }
    let backedUpVault;

    for(let store of this.#backupStores) {
      const backedUpState = await store.get();
      if (backedUpState?.data) {
        const appStateControllerState = backedUpState.data.AppStateController as AppStateControllerState;
        const newAppStateControllerState = {
          ...appStateControllerState,
          stateWasJustRestoredFromBackup: true,
        }
        backedUpState.data.AppStateController = newAppStateControllerState
        return await this.#localStore.set({
          data: backedUpState.data,
          meta: this.#metadata,
        });
      }
    }
  }

  cleanUpMostRecentRetrievedState() {
    if (this.#mostRecentRetrievedState) {
      this.#mostRecentRetrievedState = null;
    }
  }
}
