/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 66;

/**
 * Changes the useLedgerLive boolean property to the ledgerTransportType enum
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
  delete newState.PreferencesController.useLedgerLive;
  return newState;
}
