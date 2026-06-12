import { hasProperty, isObject } from '@metamask/utils';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 192;

/**
 * This migration moves `firstTimeInfo` from the top-level state to
 * `AppMetadataController.firstTimeInfo`. This consolidates all app metadata
 * in one controller and allows `firstTimeInfo` to be backed up automatically
 * since `AppMetadataController` is in `backedUpStateKeys`.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @param changedControllers - A set of controller keys that have been changed by the migration.
 */
export async function migrate(
  versionedData: VersionedData,
  changedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  // Check if firstTimeInfo exists at the top level
  if (!hasProperty(state, 'firstTimeInfo')) {
    return;
  }

  const { firstTimeInfo } = state;

  // Validate firstTimeInfo structure
  if (
    !isObject(firstTimeInfo) ||
    !hasProperty(firstTimeInfo, 'version') ||
    typeof firstTimeInfo.version !== 'string' ||
    !hasProperty(firstTimeInfo, 'date') ||
    typeof firstTimeInfo.date !== 'number'
  ) {
    // Invalid firstTimeInfo, just delete it
    delete state.firstTimeInfo;
    // Mark firstTimeInfo as changed so it gets deleted in split storage mode
    changedControllers.add('firstTimeInfo');
    return;
  }

  // Ensure AppMetadataController exists
  if (!hasProperty(state, 'AppMetadataController')) {
    state.AppMetadataController = {};
  }

  const appMetadataController = state.AppMetadataController;
  if (!isObject(appMetadataController)) {
    // Invalid AppMetadataController, cannot migrate
    delete state.firstTimeInfo;
    // Mark firstTimeInfo as changed so it gets deleted in split storage mode
    changedControllers.add('firstTimeInfo');
    return;
  }

  // Move firstTimeInfo to AppMetadataController
  appMetadataController.firstTimeInfo = {
    version: firstTimeInfo.version,
    date: firstTimeInfo.date,
  };

  // Remove from top-level state
  delete state.firstTimeInfo;

  changedControllers.add('AppMetadataController');
  // Mark firstTimeInfo as changed so it gets deleted in split storage mode
  changedControllers.add('firstTimeInfo');
}
