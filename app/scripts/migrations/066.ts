import { cloneDeep } from 'lodash';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 66;

/**
 * Changes the useLedgerLive boolean property to the ledgerTransportType enum
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
  const ledgerTransportTypes = LedgerTransportTypes as Record<string, string>;
  let hasWebHid = false;
  if (typeof window !== 'undefined') {
    hasWebHid = Boolean(window.navigator.hid);
  }
  const defaultTransportType = hasWebHid
    ? LedgerTransportTypes.webhid
    : LedgerTransportTypes.u2f;
  const useLedgerLive = Boolean(state.PreferencesController?.useLedgerLive);
  const newState = {
    ...state,
    PreferencesController: {
      ...state?.PreferencesController,
      ledgerTransportType: useLedgerLive
        ? ledgerTransportTypes.live
        : defaultTransportType,
    },
  };
  if (newState.PreferencesController) {
    delete newState.PreferencesController.useLedgerLive;
  }
  return newState;
}
