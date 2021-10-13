import { cloneDeep } from 'lodash';

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
  const useLedgerLive = state?.PreferencesController?.useLedgerLive;
  const newState = {
    ...state,
    PreferencesController: {
      ...state?.PreferencesController,
      ledgerTransportType: useLedgerLive ? 'ledgerLive' : '',
    },
  };
  delete newState.PreferencesController.useLedgerLive;
  return newState;
}
