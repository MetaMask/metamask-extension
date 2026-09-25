import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 45;

type LegacyPreferencesController = {
  ipfsGateway?: string;
  [key: string]: unknown;
};

type LegacyState = MigrationState['data'] &
  Partial<Record<'PreferencesController', LegacyPreferencesController>>;

/**
 * Replaces {@code PreferencesController.ipfsGateway} with 'dweb.link' if set
 */
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

const outdatedGateways = ['ipfs.io', 'ipfs.dweb.link'];

function transformState(state: LegacyState): LegacyState {
  if (
    outdatedGateways.includes(state?.PreferencesController?.ipfsGateway ?? '')
  ) {
    state.PreferencesController ??= {};
    state.PreferencesController.ipfsGateway = 'dweb.link';
  }
  return state;
}
