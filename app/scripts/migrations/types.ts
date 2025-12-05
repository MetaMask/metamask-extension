/**
 * Versioned MetaMask extension state; what we persist to dist.
 */
export type VersionedData = {
  /**
   * Metadata about the state being migrated.
   */
  meta: {
    /**
     * The current state version.
     */
    version: number;
    /**
     * The kind of storage being used.
     */
    storageKind?: 'data' | 'split';
  };
  /**
   * The persisted MetaMask state, keyed by controller.
   */
  data: Record<string, unknown>;
};
/**
 * `Set` to track which controller keys were modified by a migration
 */
export type ChangedKeys = Set<string>;

/**
 * A migration function that updates the versioned MetaMask extension state.
 */
export type Migrate = (
  versionedData: VersionedData,
  changedKeys: ChangedKeys,
) => void | Promise<void>;
