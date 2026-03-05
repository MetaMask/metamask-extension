import type { Migrate } from './types';

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
 * This migration removes legacy state from GatorPermissionsController 1.x.x
 * - `gatorPermissionsMapSerialized` was cached data only.
 * - `isGatorPermissionsEnabled` was set on controller initialization, so never needed to be persisted.
 * - `gatorPermissionsProviderSnapId` was set on controller initialization, so never needed to be persisted.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}) satisfies Migrate;

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
