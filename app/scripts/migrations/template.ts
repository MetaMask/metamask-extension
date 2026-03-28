import type { Migrate } from './types';

/**
 * The version number of this migration.
 */
export const version = 0;

/**
 * Explain the purpose of the migration here.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param versionedData.meta - Metadata about the state being migrated.
 * @param versionedData.meta.version - The current state version.
 * @param versionedData.meta.storageKind - The kind of storage being used.
 * @param versionedData.data - The persisted MetaMask state, keyed by controller.
 * @param changedKeys - `Set` to track which controller keys were modified by a migration
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;
  // if your `transformState` is async, you must `await` it, if it is not async,
  // don't `await` it.
  transformState(versionedData.data, changedKeys);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedKeys: Set<string>,
): Promise<void> | void {
  // transform state here

  // Example transformation:
  (state.ControllerKey as { newProperty: string }).newProperty = 'newValue';
  delete state.OldControllerKey;
  // if you add/remove/edit a new controller key, you need to track it in
  // `changedKeys` or your migration will not persist.
  changedKeys.add('ControllerKey');
  changedKeys.add('OldControllerKey');
}
