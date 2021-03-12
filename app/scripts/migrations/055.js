import { cloneDeep, mapKeys } from 'lodash';
import { NETWORK_TYPE_TO_ID_MAP } from '../../../shared/constants/network';

const version = 55;

/**
 * replace 'incomingTxLastFetchedBlocksByNetwork' with 'incomingTxLastFetchedBlockByChainId'
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  if (
    state?.IncomingTransactionsController?.incomingTxLastFetchedBlocksByNetwork
  ) {
    state.IncomingTransactionsController.incomingTxLastFetchedBlockByChainId = mapKeys(
      state.IncomingTransactionsController.incomingTxLastFetchedBlocksByNetwork,
      (_, key) => NETWORK_TYPE_TO_ID_MAP[key].chainId,
    );
    delete state.IncomingTransactionsController
      .incomingTxLastFetchedBlocksByNetwork;
  }
  return state;
}
