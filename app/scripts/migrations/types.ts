import type { MetaMaskStorageStructure } from '../lib/stores/base-store';

/**
 * `Set` to track which controller keys were modified by a migration
 */
export type ChangedKeys = Set<string>;

/**
 * A migration function that updates the versioned MetaMask extension state.
 */
export type Migrate = (
  versionedData: Required<MetaMaskStorageStructure>,
  changedKeys: ChangedKeys,
) => void | Promise<void>;
