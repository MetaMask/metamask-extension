import { cloneDeep } from 'lodash';
import { LEDGER_TRANSPORT_TYPES } from '../../../shared/constants/hardware-wallets';

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
    ? LEDGER_TRANSPORT_TYPES.WEBHID
    : LEDGER_TRANSPORT_TYPES.U2F;
  const useLedgerLive = Boolean(state.PreferencesController?.useLedgerLive);
  const newState = {
    ...state,
    PreferencesController: {
      ...state?.PreferencesController,
      ledgerTransportType: useLedgerLive
        ? LEDGER_TRANSPORT_TYPES.LIVE
        : defaultTransportType,
    },
  };
  delete newState.PreferencesController.useLedgerLive;
  return newState;
}
