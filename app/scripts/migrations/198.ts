import { getErrorMessage } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

/**
 * The version number of this migration.
 */
export const version = 198;

type GatorPermissionsControllerStateV1 = {
  gatorPermissionsMapSerialized?: string;
  isGatorPermissionsEnabled?: boolean;
  gatorPermissionsProviderSnapId?: string;
};

/**
 * Removes legacy state from GatorPermissionsController 1.x.x
 * - `gatorPermissionsMapSerialized` was cached data only.
 * - `isGatorPermissionsEnabled` was set on controller initialization, so never needed to be persisted.
 * - `gatorPermissionsProviderSnapId` was set on controller initialization, so never needed to be persisted.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @param localChangedControllers - A set of controller keys that have been changed by the migration.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  versionedData: VersionedData,
  localChangedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  const changedVersionedData = cloneDeep(versionedData);
  const changedLocalChangedControllers = new Set<string>();

  try {
    transformState(changedVersionedData.data, changedLocalChangedControllers);
    versionedData.data = changedVersionedData.data;
    changedLocalChangedControllers.forEach((controller) =>
      localChangedControllers.add(controller),
    );
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
  }
}

function transformState(
  state: Record<string, unknown>,
  changedLocalChangedControllers: Set<string>,
) {
  if (state.GatorPermissionsController) {
    const gatorPermissionsController =
      state.GatorPermissionsController as GatorPermissionsControllerStateV1;

    delete gatorPermissionsController.gatorPermissionsMapSerialized;
    delete gatorPermissionsController.isGatorPermissionsEnabled;
    delete gatorPermissionsController.gatorPermissionsProviderSnapId;

    changedLocalChangedControllers.add('GatorPermissionsController');
  }

  return state;
}
