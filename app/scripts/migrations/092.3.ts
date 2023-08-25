import { isNullOrUndefined } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 92.3;

/**
 * This migration does the following:
 *
 * - Deletes currently stored advancedGasFee in preferences controller, replacing the default with an empty object
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  migrateData(versionedData.data);
  return versionedData;
}

function migrateData(state: Record<string, unknown>): void {
  changeShapeAndRemoveOldAdvancedGasFeePreference(state);
}

function changeShapeAndRemoveOldAdvancedGasFeePreference(
  state: Record<string, any>,
) {
  if (isNullOrUndefined(state.PreferencesController)) {
    return;
  }

  state.AppStateController = {
    ...(state.AppStateController ?? {}),
    hadAdvancedGasFeesSetPriorToMigration92_3:
      state.PreferencesController?.advancedGasFee !== null,
  };

  state.PreferencesController = {
    ...(state.PreferencesController ?? {}),
    advancedGasFee: {},
  };
}
