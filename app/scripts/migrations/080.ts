import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 80;

/**
 * The portfolio tooltip has been moved to a button on the home screen so
 * this property is no longer needed in state
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState) {
  if (state?.metamask?.showPortfolioTooltip !== undefined) {
    delete state.metamask.showPortfolioTooltip;
  }

  return state;
}
