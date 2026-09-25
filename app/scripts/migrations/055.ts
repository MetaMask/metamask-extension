/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep, mapKeys } from 'lodash';
import { BUILT_IN_NETWORKS } from '../../../shared/constants/network';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 55;

/**
 * replace 'incomingTxLastFetchedBlocksByNetwork' with 'incomingTxLastFetchedBlockByChainId'
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

export default migration;

const UNKNOWN_CHAIN_ID_KEY = 'UNKNOWN';
const builtInNetworks = BUILT_IN_NETWORKS as Record<
  string,
  {
    networkId: string;
    chainId: string;
    ticker: string;
  }
>;

builtInNetworks.rinkeby = {
  networkId: '4',
  chainId: '0x4',
  ticker: 'ETH',
};
builtInNetworks.ropsten = {
  networkId: '3',
  chainId: '0x3',
  ticker: 'ETH',
};
builtInNetworks.kovan = {
  networkId: '42',
  chainId: '0x2a',
  ticker: 'ETH',
};

function transformState(state: LegacyState) {
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
        (_value, key) => builtInNetworks[key]?.chainId ?? UNKNOWN_CHAIN_ID_KEY,
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
