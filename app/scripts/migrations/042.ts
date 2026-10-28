import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 42;

/**
 * Initialize `connectedStatusPopoverHasBeenShown` to `false` if it hasn't yet been set,
 * so that existing users are introduced to the new connected status indicator
 */
type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'AppStateController',
      {
        connectedStatusPopoverHasBeenShown?: boolean;
      }
    >
  >;

export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  if (state.AppStateController) {
    state.AppStateController.connectedStatusPopoverHasBeenShown = false;
  } else {
    state.AppStateController = {
      connectedStatusPopoverHasBeenShown: false,
    };
  }
  return state;
}
