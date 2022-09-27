import { cloneDeep, mapKeys } from 'lodash';
import { BUILT_IN_NETWORKS } from '../../../shared/constants/network';

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

const UNKNOWN_CHAIN_ID_KEY = 'UNKNOWN';

BUILT_IN_NETWORKS.rinkeby = {
  networkId: '4',
  chainId: '0x4',
  ticker: 'ETH',
};
BUILT_IN_NETWORKS.ropsten = {
  networkId: '3',
  chainId: '0x3',
  ticker: 'ETH',
};
BUILT_IN_NETWORKS.kovan = {
  networkId: '42',
  chainId: '0x2a',
  ticker: 'ETH',
};

function transformState(state) {
  if (
    state?.IncomingTransactionsController?.incomingTxLastFetchedBlocksByNetwork
  ) {
    state.IncomingTransactionsController.incomingTxLastFetchedBlockByChainId =
      mapKeys(
        state.IncomingTransactionsController
          .incomingTxLastFetchedBlocksByNetwork,
        // using optional chaining in case user's state has fetched blocks for
        // RPC network types (which don't map to a single chainId). This should
        // not be possible, but it's safer
        (_, key) => BUILT_IN_NETWORKS[key]?.chainId ?? UNKNOWN_CHAIN_ID_KEY,
      );
    // Now that mainnet and test net last fetched blocks are keyed by their
    // respective chainIds, we can safely delete anything we had for custom
    // networks. Any custom network that shares a chainId with one of the
    // aforementioned networks will use the value stored by chainId.
    delete state.IncomingTransactionsController
      .incomingTxLastFetchedBlockByChainId[UNKNOWN_CHAIN_ID_KEY];
    delete state.IncomingTransactionsController
      .incomingTxLastFetchedBlocksByNetwork;
  }
  return state;
}
