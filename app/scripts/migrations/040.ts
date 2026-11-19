import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 40;

/**
 * Site connections are now managed by the PermissionsController, and the
 * ProviderApprovalController is removed. This migration deletes all
 * ProviderApprovalController state.
 */
type LegacyState = MigrationState['data'] &
  Partial<Record<'ProviderApprovalController', object>>;

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
  delete state.ProviderApprovalController;
  return state;
}
