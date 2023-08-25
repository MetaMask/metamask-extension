import { hasProperty, isNullOrUndefined, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import log from 'loglevel';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 92.3;

/**
 * This migration does the following:
 *
 * - Deletes currently stored advancedGasFee in preferences controller,
 * replacing the default with an empty object
 * - Sets hadAdvancedGasFeesSetPriorToMigration92_3 flag on AppStateController
 * to indicate if the user had previously had advancedGasFee set in their
 * preferences. This will be used to display a whats new entry to inform users
 * that we wiped these settings and made them apply per network.
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
  state: Record<string, unknown>,
) {
  if (isNullOrUndefined(state.PreferencesController)) {
    log.warn(
      `Migration #${version}: preferences controller null or undefined, skipping migration`,
    );
    return;
  }

  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController) &&
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController)
  ) {
    const possibleOriginalValue = state.PreferencesController?.advancedGasFee;

    // Will be false if the keys set on the object are anything other than the
    // maxBaseFee or priorityFee. Essentially if the object is already keyed
    // by chainId it won't show as hadFeesSet.
    const hadFeesSet =
      isObject(possibleOriginalValue) &&
      hasFeePreferenceKeys(possibleOriginalValue);

    state.AppStateController.hadAdvancedGasFeesSetPriorToMigration92_3 =
      hadFeesSet;

    if (
      state.PreferencesController.advancedGasFee === null ||
      (isObject(state.PreferencesController.advancedGasFee) &&
        hasFeePreferenceKeys(state.PreferencesController.advancedGasFee))
    ) {
      state.PreferencesController.advancedGasFee = {};
    }
  } else if (isObject(state.AppStateController) === false) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.AppStateController is ${typeof state.AppStateController}`,
      ),
    );
  } else if (isObject(state.PreferencesController) === false) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.PreferencesController is ${typeof state.PreferencesController}`,
      ),
    );
  }
}

function hasFeePreferenceKeys(objectToCheck: Record<string, unknown>): boolean {
  const keys = Object.keys(objectToCheck);

  if (keys.includes('maxBaseFee') || keys.includes('priorityFee')) {
    return true;
  }
  return false;
}
