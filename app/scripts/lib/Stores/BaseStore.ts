/**
 * This type is a temporary type that is used to represent the state tree of
 * MetaMask. This type is used in the BaseStore class and its extending classes
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
export type MetaMaskStorageStructure = {
  data?: IntermediaryStateType;
  meta?: MetaData;
};

/**
 * When loading state from storage, if the state is not available, then the
 * extension storage api, at least in the case of chrome, returns an empty
 * object. This type represents that empty object to be used in error handling
 * and state initialization.
 */
export type EmptyState = Omit<MetaMaskStorageStructure, 'data' | 'meta'>;

/**
 * The BaseStore class is an Abstract Class meant to be extended by other classes
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
export abstract class BaseStore {
  abstract set(state: IntermediaryStateType): Promise<void>;

  abstract get(): Promise<MetaMaskStorageStructure | null>;
}
