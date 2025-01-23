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
 * The BaseStore class is an abstract class designed to be extended by other
 * classes that implement the abstract methods `set` and `get`. This class
 * provides the foundation for different storage implementations, enabling
 * them to adhere to a consistent interface for retrieving and setting
 * application state.
 *
 * Responsibilities of extending classes:
 * 1. **Retrieve State:**
 * - Implement a `get` method that retrieves the current state from the
 * underlying storage system. This method should return `null` when the
 * state is unavailable.
 *
 * 2. **Set State:**
 * - Implement a `set` method that updates the state in the underlying
 * storage system. This method should handle necessary validation or
 * error handling to ensure the state is persisted correctly.
 *
 * This class does not provide any concrete implementation for these methods,
 * leaving the specifics to the extending classes based on the storage
 * mechanism they represent.
 */
export abstract class BaseStore {
  abstract set(state: IntermediaryStateType): Promise<void>;

  abstract get(): Promise<MetaMaskStorageStructure | null>;
}
