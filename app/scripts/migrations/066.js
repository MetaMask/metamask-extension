import { cloneDeep } from 'lodash';
import { LEDGER_TRANSPORT_TYPES } from '../../../shared/constants/hardware-wallets';
import { getInitLedgerTransportType } from '../../../shared/lib/preferences-utils';

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
  const defaultTransportType = getInitLedgerTransportType();
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
