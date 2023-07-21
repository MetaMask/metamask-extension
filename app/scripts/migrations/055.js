import { cloneDeep, mapKeys } from 'lodash';

const NETWORK_IDS = {
  MAINNET: '1',
  GOERLI: '5',
  LOCALHOST: '1337',
  SEPOLIA: '11155111',
  LINEA_GOERLI: '59140',
  LINEA_MAINNET: '59144',
};

const CHAIN_IDS = {
  MAINNET: '0x1',
  GOERLI: '0x5',
  LOCALHOST: '0x539',
  BSC: '0x38',
  BSC_TESTNET: '0x61',
  OPTIMISM: '0xa',
  OPTIMISM_TESTNET: '0x1a4',
  POLYGON: '0x89',
  POLYGON_TESTNET: '0x13881',
  AVALANCHE: '0xa86a',
  AVALANCHE_TESTNET: '0xa869',
  FANTOM: '0xfa',
  FANTOM_TESTNET: '0xfa2',
  CELO: '0xa4ec',
  ARBITRUM: '0xa4b1',
  HARMONY: '0x63564c40',
  PALM: '0x2a15c308d',
  SEPOLIA: '0xaa36a7',
  LINEA_GOERLI: '0xe704',
  LINEA_MAINNET: '0xe708',
  AURORA: '0x4e454152',
  MOONBEAM: '0x504',
  MOONBEAM_TESTNET: '0x507',
  MOONRIVER: '0x505',
  CRONOS: '0x19',
};

const NETWORK_TYPES = {
  GOERLI: 'goerli',
  LOCALHOST: 'localhost',
  MAINNET: 'mainnet',
  RPC: 'rpc',
  SEPOLIA: 'sepolia',
  LINEA_GOERLI: 'linea-goerli',
  LINEA_MAINNET: 'linea-mainnet',
};

const TEST_NETWORK_TICKER_MAP = {
  [NETWORK_TYPES.GOERLI]: `GoerliETH`,
  [NETWORK_TYPES.SEPOLIA]: `SepoliaETH`,
  [NETWORK_TYPES.LINEA_GOERLI]: `LineaETH`,
};

const BUILT_IN_NETWORKS = {
  [NETWORK_TYPES.GOERLI]: {
    networkId: NETWORK_IDS.GOERLI,
    chainId: CHAIN_IDS.GOERLI,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
    blockExplorerUrl: `https://${NETWORK_TYPES.GOERLI}.etherscan.io`,
  },
  [NETWORK_TYPES.SEPOLIA]: {
    networkId: NETWORK_IDS.SEPOLIA,
    chainId: CHAIN_IDS.SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
    blockExplorerUrl: `https://${NETWORK_TYPES.SEPOLIA}.etherscan.io`,
  },
  [NETWORK_TYPES.LINEA_GOERLI]: {
    networkId: NETWORK_IDS.LINEA_GOERLI,
    chainId: CHAIN_IDS.LINEA_GOERLI,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_GOERLI],
    blockExplorerUrl: 'https://goerli.lineascan.build',
  },
  [NETWORK_TYPES.MAINNET]: {
    networkId: NETWORK_IDS.MAINNET,
    chainId: CHAIN_IDS.MAINNET,
    blockExplorerUrl: `https://etherscan.io`,
  },
  [NETWORK_TYPES.LINEA_MAINNET]: {
    networkId: NETWORK_IDS.LINEA_MAINNET,
    chainId: CHAIN_IDS.LINEA_MAINNET,
    blockExplorerUrl: 'https://lineascan.build',
  },
  [NETWORK_TYPES.LOCALHOST]: {
    networkId: NETWORK_IDS.LOCALHOST,
    chainId: CHAIN_IDS.LOCALHOST,
  },
}

const version = 55;

/**
 * replace 'incomingTxLastFetchedBlocksByNetwork' with 'incomingTxLastFetchedBlockByChainId'
 */
export default {
  CHAIN_IDS,
  NETWORK_TYPES,
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
