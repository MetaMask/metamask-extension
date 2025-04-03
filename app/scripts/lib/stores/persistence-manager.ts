import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { isEmpty } from 'lodash';
import { KeyringControllerState } from '@metamask/keyring-controller';
import { MISSING_VAULT_ERROR } from '../../../../shared/constants/errors';
import type {
  MetaMaskStateType,
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';
import { DB } from './indexeddb-store';

const STATE_LOCK = 'state-lock';

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
  #metadata?: MetaData;

  #isExtensionInitialized: boolean = false;

  #localStore: BaseStore;

  #db: DB;

  #open: boolean = false;

  constructor({ localStore }: { localStore: BaseStore }) {
    this.#localStore = localStore;
    this.#db = new DB();
  }

  async open() {
    if (!this.#open) {
      await this.#db.open('metamask-vault', 1);
      this.#open = true;
    }
  }

  setMetadata(metadata: MetaData) {
    this.#metadata = metadata;
  }

  /**
   * Sets the state in the local store.
   *
   * @param state - The state to set in the local store. This should be an object
   * containing the state data to be stored.
   * @throws Error if the state is missing or if the metadata is not set before
   * calling this method.
   * @throws Error if the local store is not open.
   * @throws Error if the data persistence fails during the write operation.
   */
  async set(state: MetaMaskStateType) {
    await this.open();

    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    const meta = this.#metadata;
    if (!meta) {
      throw new Error('MetaMask - metadata must be set before calling "set"');
    }

    await navigator.locks.request(
      STATE_LOCK,
      { mode: 'exclusive' },
      async () => {
        try {
          // atomically set all the keys
          await this.#localStore.set({
            data: state,
            meta,
          });

          // back up the vault in IndexedDB
          const keyringController =
            state.KeyringController as KeyringControllerState;
          const vault = keyringController?.vault;
          if (vault) {
            await this.#db.set({ vault });
          } else {
            // if we don't have a vault, remove the backup from IndexedDB
            // TODO: should we create a backup for the backup when a vault is
            // removed?
            await this.#db.remove(['vault']);
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
      },
    );
  }

  /**
   * Retrieves the current state of the local store. If the store is empty,
   * it returns null. If the store is not open, it throws an error.
   *
   * @returns The current state of the local store or null if the store is empty.
   * @throws Error if the vault is missing and a backup vault is found in IndexedDB.
   * @throws Error if the local store is not open.
   */
  async get(): Promise<MetaMaskStorageStructure | null> {
    await this.open();

    return await navigator.locks.request(
      STATE_LOCK,
      { mode: 'shared' },
      async () => {
        const result = await this.#localStore.get();

        const keyringController = result?.data?.KeyringController as
          | KeyringControllerState
          | undefined;
        const hasVault = keyringController?.vault;

        if (!hasVault) {
          // check if we have a backup vault in IndexedDB
          // if we do, we need to throw an error so that the user can be
          // prompted to restore it
          // if we don't, carry on as if everything is fine (it might be)
          const [backupVault] = (await this.#db.get(['vault'])) as [
            string | undefined,
          ];
          if (backupVault) {
            throw new Error(MISSING_VAULT_ERROR);
          }
        }

        if (isEmpty(result)) {
          this.#mostRecentRetrievedState = null;
          return undefined;
        }
        if (!this.#isExtensionInitialized) {
          this.#mostRecentRetrievedState = result;
        }
        return result;
      },
    );
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
