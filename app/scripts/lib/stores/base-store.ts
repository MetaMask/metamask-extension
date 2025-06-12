/**
 * This type is used to represent the state tree of MetaMask.
 */
export type MetaMaskStateType = Record<string, unknown>;

/**
 * This type represents the 'meta' key on the state object. This key is used to
 * store the current version of the state tree as set in the various migrations
 * ran by the migrator. This key is used to determine if the state tree should
 * be updated when the extension is loaded, by comparing the version to the
 * target versions of the migrations.
 */
export type MetaData = {
  /**
   * The version of the state tree determined by the
   * migration
   */
  version: number;
};

/**
 * This type represents the structure of the storage object that is saved in
 * extension storage. This object has two keys, 'data' and 'meta'. The 'data'
 * key is the entire state tree of MetaMask and the meta key contains an object
 * with a single key 'version' that is the current version of the state tree.
 */
export type MetaMaskStorageStructure = {
  /**
   * The MetaMask State tree
   */
  data?: MetaMaskStateType;
  /**
   * The metadata object
   */
  meta?: MetaData;
};

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
 */
export type BaseStore = {
  set: (state: Required<MetaMaskStorageStructure>) => Promise<void>;

  get: () => Promise<MetaMaskStorageStructure | null>;

  reset: () => Promise<void>;
};
