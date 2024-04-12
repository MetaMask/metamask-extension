import type Migrator from '../../../app/scripts/lib/migrator';
import firstTimeState from '../../../app/scripts/first-time-state';

/**
 * This type is a temporary type that is used to represent the state tree of
 * MetaMask. This type is used in the Storage class and its extending classes
 * and should ultimately be replaced by the fully typed State Tree once that is
 * available for consumption. We should likely optimize the state tree by
 * storing the individual controllers in their own keys in the state tree. This
 * would allow for partial updates at the controller state level, without
 * modifying the entire data key.
 */
export type IntermediaryStateType = Record<string, unknown>;

/**
 * This type represents the 'meta' key on the state object. This key is used to
 * store the current version of the state tree as set in the various migrations
 * ran by the migrator. This key is used to determine if the state tree should
 * be updated when the extension is loaded, by comparing the version to the
 * target versions of the migrations.
 */
export type MetaData = { version: number };

/**
 * This type represents the structure of the storage object that is saved in
 * extension storage. This object has two keys, 'data' and 'meta'. The 'data'
 * key is the entire state tree of MetaMask and the meta key contains an object
 * with a single key 'version' that is the current version of the state tree.
 */
export interface MetaMaskStorageStructure {
  data?: IntermediaryStateType;
  meta?: MetaData;
}

/**
 * When loading state from storage, if the state is not available, then the
 * extension storage api, at least in the case of chrome, returns an empty
 * object. This type represents that empty object to be used in error handling
 * and state initialization.
 */
export type EmptyState = Omit<MetaMaskStorageStructure, 'data' | 'meta'>;

/**
 * The Storage class is an Abstract Class meant to be extended by other classes
 * that implement the methods and properties marked as abstract. There are a
 * few properties and methods that are not abstract and are implemented here to
 * be consumed by the extending classes. At the time of writing this class
 * there are only two extending classes: ReadOnlyNetworkStore and
 * ExtensionStore. Both of these extending classes are the result of
 * refactoring the previous storage implementation to TypeScript while
 * consolidating some logic related to storage that was external to the
 * implementation of those storage systems. ReadOnlyNetworkStore is a class
 * that is used while in an End To End or other Test environment where the full
 * chrome storage API may not be available. ExtensionStore is the class that is
 * used when the full chrome storage API is available. While Chrome is the
 * target of this documentation, Firefox also has a mostly identical storage
 * API that is used interchangeably.
 *
 * The classes that extend this system take on the responsibilities listed here
 * 1. Retrieve the current state from the underlying storage system. If that
 * state is unavailable, then the storage system should return a default state
 * in the case that this is the first time the extension has been installed. If
 * the state is not available due to some form of possible corruption, using
 * the best methods available to detect such things, then a backup of the vault
 * should be inserted into a state tree that otherwise resembles a first time
 * installation. If the backup of the vault is unavailable, then a default
 * state tree should be used. In any case we should provide clear and concise
 * communication to the user about what happened and their best recourse for
 * handling the situation if the extension cannot gracefully recover.
 *
 * 2. Set the current state to the underlying storage system. This should be
 * implemented in such a way that the current metadata is stored in a separate
 * key that is tracked by the storage system. This metadata should *not* be a
 * input to the set method. If the underlying storage system allows for partial
 * state objects it should be sufficient to pass the data key, which is the
 * full MetaMask state tree. If not, then the metadata should be supplied by
 * the storage system itself.
 *
 * 3. Provide a method for generating a first time state tree. This method is
 * implemented as a part of this Abstract class and should not be overwritten
 * unless future work requires specific implementations for different storage
 * systems. This method should return a state tree that is the default state
 * tree for a new install.
 */
export abstract class Storage {
  /**
   * isSupported is a boolean that is set to true if the underlying storage
   * system is supported by the current browser and implementation.
   */
  abstract isSupported: boolean;
  /**
   * dataPersistenceFailing is a boolean that is set to true if the storage
   * system attempts to write state and the write operation fails. This is only
   * used as a way of deduplicating error reports sent to sentry as it is
   * likely that multiple writes will fail concurrently.
   */
  abstract dataPersistenceFailing: boolean;
  /**
   * mostRecentRetrievedState is a property that holds the most recent state
   * successfully retrieved from memory. Due to the nature of async read
   * operations it is beneficial to have a near real-time snapshot of the state
   * for sending data to sentry as well as other developer tooling.
   */
  abstract mostRecentRetrievedState: MetaMaskStorageStructure | null;
  /**
   * metadata is a property that holds the current metadata object. This object
   * includes a single key which is 'version' and contains the current version
   * number of the state tree. This is only incremented via the migrator and in
   * a well functioning (typical) install should match the latest migration's
   * version number.
   */
  #metadata?: { version: number };
  /**
   * migrator is a property that holds the migrator instance that is used to
   * migrate state from one shape to another. This migrator is used to create
   * the first time state tree.
   */
  abstract migrator: Migrator;

  /**
   * Sets the current metadata. The set method that is implemented in storage
   * classes only requires an object that is set on the 'data' key. The
   * metadata key of this class is set on the 'meta' key of the underlying
   * storage implementation (e.g. chrome.storage.local).
   */
  set metadata(metadata: { version: number }) {
    this.#metadata = metadata;
  }

  /**
   * Gets the current metadata object and returns it. The underlying key is
   * private and implemented in the Storage class so that the extending class
   * can access it through this getter.
   */
  get metadata(): { version: number } | undefined {
    return this.#metadata;
  }

  /**
   * Generates the first time state tree. This method is used to generate the
   * MetaMask state tree in its initial shape using the migrator.

   * @returns state - The first time state tree generated by the migrator
   */
  generateFirstTimeState() {
    return this.migrator.generateInitialState(
      firstTimeState,
    ) as Required<MetaMaskStorageStructure>;
  }

  abstract set(state: IntermediaryStateType): Promise<void>;
  abstract get(): Promise<MetaMaskStorageStructure>;
  abstract isFirstTimeInstall(): Promise<boolean>;
}
