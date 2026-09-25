/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

export type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 106;

/**
 * This migration set preference securityAlertsEnabled to true.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

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
