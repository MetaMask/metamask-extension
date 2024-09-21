import { cloneDeep } from 'lodash';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';

const version = 66;

/**
 * Changes the useLedgerLive boolean property to the ledgerTransportType enum
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const defaultTransportType = window.navigator.hid
    ? LedgerTransportTypes.webhid
    : LedgerTransportTypes.u2f;
  const useLedgerLive = Boolean(state.PreferencesController?.useLedgerLive);
  const newState = {
    ...state,
    PreferencesController: {
      ...state?.PreferencesController,
      ledgerTransportType: useLedgerLive
        ? LedgerTransportTypes.live
        : defaultTransportType,
    },
  };
  delete newState.PreferencesController.useLedgerLive;
  return newState;
}
