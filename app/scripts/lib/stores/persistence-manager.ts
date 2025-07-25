import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { isEmpty } from 'lodash';
import { RuntimeObject, hasProperty, isObject } from '@metamask/utils';
import { MISSING_VAULT_ERROR } from '../../../../shared/constants/errors';
import { IndexedDBStore } from './indexeddb-store';
import type {
  MetaMaskStateType,
  MetaMaskStorageStructure,
  BaseStore,
  MetaData,
} from './base-store';

export type Backup = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  KeyringController?: unknown;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AppMetadataController?: unknown;
  meta?: MetaData;
};

export const backedUpStateKeys = [
  'KeyringController',
  'AppMetadataController',
] as const;

/**
 * This Error represents an error that occurs during persistence operations.
 * It includes a backup of the state at the time of the error.
 */
export class PersistenceError extends Error {
  backup: object | null;

  constructor(message: string, backup: object | null) {
    super(message);
    this.name = 'PersistenceError';
    this.backup = backup;
  }
}

/**
 * Pulls out the relevant state from the MetaMask state object and returns
 * an object to be backed up.
 *
 * We don't back up all properties of the state object, only the ones that are
 * relevant for restoring the state. This is to avoid unnecessary data
 * duplication and ensure efficient storage usage.
 *
 * @param state - The current MetaMask state.
 * @param meta - The metadata object containing versioning information.
 * @returns A Backup object containing the state of various controllers.
 */
function makeBackup(state: MetaMaskStateType, meta: MetaData): Backup {
  return {
    KeyringController: state?.KeyringController,
    AppMetadataController: state?.AppMetadataController,
    meta,
  };
}

/**
 * Checks if the state contains a vault. This can be used to determine if the
 * MetaMask state is in a valid state for backup.
 *
 * @param state - The current MetaMask state.
 * @returns
 */
function hasVault(
  state?: MetaMaskStateType,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
): state is { KeyringController: RuntimeObject & Record<'vault', unknown> } {
  const keyringController = state?.KeyringController;
  return (
    isObject(keyringController) &&
    hasProperty(keyringController, 'vault') &&
    Boolean(keyringController?.vault)
  );
}

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

  #backupDb: IndexedDBStore;

  #backup?: string;

  #open: boolean = false;

  constructor({ localStore }: { localStore: BaseStore }) {
    this.#localStore = localStore;
    this.#backupDb = new IndexedDBStore();
  }

  async open() {
    if (!this.#open) {
      await this.#backupDb.open('metamask-backup', 1);
      this.#open = true;
    }
  }

  setMetadata(metadata: MetaData) {
    this.#metadata = metadata;
  }

  #pendingState: void | AbortController = undefined;

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

    const abortController = new AbortController();

    // If we already have a write _pending_, abort it so the more up-to-date
    // write can take its place. This is to prevent piling up multiple writes
    // in the lock queue, which is pointless because we only care about the most
    // recent write. This should rarely happen, as elsewhere we make use of
    // `debounce` for all `set` requests in order to slow them to once per
    // 1000ms; however, if the state is very large it *can* take more than the
    // `debounce`'s `wait` time to write, resulting in a pile up right here.
    // This prevents that pile up from happening.
    this.#pendingState?.abort();
    this.#pendingState = abortController;

    await navigator.locks.request(
      STATE_LOCK,
      { mode: 'exclusive', signal: abortController.signal },
      async () => {
        this.#pendingState = undefined;
        try {
          // atomically set all the keys
          await this.#localStore.set({
            data: state,
            meta,
          });

          const backup = makeBackup(state, meta);
          // if we have a vault we can back it up
          if (hasVault(backup)) {
            const stringifiedBackup = JSON.stringify(backup);
            // and the backup has changed
            if (this.#backup !== stringifiedBackup) {
              // save it to the backup DB
              await this.#backupDb.set(backup);
              this.#backup = stringifiedBackup;
            }
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
   * it returns undefined. If the store is not open, it throws an error.
   *
   * @param options - An object containing options for the retrieval.
   * @param options.validateVault - A flag indicating whether to validate the vault
   * @returns The current state of the local store or null if the store is empty.
   * @throws Error if the vault is missing and a backup vault is found in IndexedDB.
   * @throws Error if the local store is not open.
   */
  async get({
    validateVault,
  }: {
    validateVault: boolean;
  }): Promise<MetaMaskStorageStructure | undefined> {
    await this.open();

    return await navigator.locks.request(
      STATE_LOCK,
      { mode: 'shared' },
      async () => {
        const result = await this.#localStore.get();

        if (validateVault) {
          // if we don't have a vault
          if (!hasVault(result?.data)) {
            // check if we have a backup in IndexedDB. we need to throw an error
            // so that the user can be prompted to recover it. if we don't,
            // carry on as if everything is fine (it might be, or maybe we lost
            // BOTH the primary and backup vaults -- yikes!)
            const backup = await this.getBackup();
            // this check verifies if we have any keys saved in our backup.
            // we use this as a sigil to determine if we've ever saved a vault
            // before.
            if (Object.values(backup).some((value) => value !== undefined)) {
              // we've got some data (we haven't checked for a vault, as the
              // background+UI are responsible for determining what happens now)
              throw new PersistenceError(MISSING_VAULT_ERROR, backup);
            }
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

  /**
   * Resets the local store and the backup database. This method is used to
   * clear the state and metadata, effectively resetting the application to
   * its initial state.
   */
  async reset() {
    await navigator.locks.request(
      STATE_LOCK,
      { mode: 'exclusive' },
      async () => {
        await Promise.all([
          this.#localStore.reset(),
          await this.#backupDb.reset(),
        ]);
        this.#backup = undefined;
        this.#isExtensionInitialized = false;
        this.#dataPersistenceFailing = false;
        this.#metadata = undefined;
        this.cleanUpMostRecentRetrievedState();
      },
    );
  }

  /**
   * Retrieves the backup object containing the state of various controllers.
   */
  async getBackup(): Promise<Backup> {
    const [KeyringController, AppMetadataController, meta] =
      await this.#backupDb.get([...backedUpStateKeys, `meta`]);
    return {
      KeyringController,
      AppMetadataController,
      meta: meta as MetaData | undefined,
    };
  }

  /**
   * Logs the encrypted vault state to the console. This is useful for
   * debugging purposes.
   */
  async logEncryptedVault() {
    let state: MetaMaskStateType | Backup | undefined;
    let source: string | null = null;
    try {
      state = (await this.get({ validateVault: false }))?.data;
      source = 'primary database';
    } catch (e) {
      console.error('Error getting state from persistence manager', e);
    }
    if (!hasVault(state)) {
      // try from backup
      try {
        state = await this.getBackup();
        source = 'backup database';
      } catch (e) {
        source = null;
        console.error('Error getting state from backup', e);
      }
    }
    // if we have a vault, log it
    if (hasVault(state)) {
      console.log(`MetaMask - Encrypted Vault from ${source}:`);
      console.log(state.KeyringController.vault);
    } else {
      console.log(
        'MetaMask - No vault found in primary database or backup database',
      );
    }
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
