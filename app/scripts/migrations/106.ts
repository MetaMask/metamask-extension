import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 106;

/**
 * This migration set preference securityAlertsEnabled to true.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
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
  const PreferencesController = state?.PreferencesController || {};
  const securityAlertsEnabled =
    typeof PreferencesController.securityAlertsEnabled === 'boolean'
      ? PreferencesController.securityAlertsEnabled
      : PreferencesController.transactionSecurityCheckEnabled !== true;

  return {
    ...state,
    PreferencesController: {
      ...PreferencesController,
      securityAlertsEnabled,
    },
  };
}
