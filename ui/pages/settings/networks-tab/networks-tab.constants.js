import {
  getRpcUrl,
  TEST_NETWORK_TICKER_MAP,
  CURRENCY_SYMBOLS,
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';

const defaultNetworksData = [
  {
    labelKey: NETWORK_TYPES.MAINNET,
    iconColor: '#29B6AF',
    providerType: NETWORK_TYPES.MAINNET,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.MAINNET,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.MAINNET,
    ticker: CURRENCY_SYMBOLS.ETH,
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    labelKey: NETWORK_TYPES.ROPSTEN,
    iconColor: '#FF4A8D',
    providerType: NETWORK_TYPES.ROPSTEN,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.ROPSTEN,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.ROPSTEN,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.ROPSTEN],
    blockExplorerUrl: 'https://ropsten.etherscan.io',
  },
  {
    labelKey: NETWORK_TYPES.RINKEBY,
    iconColor: '#F6C343',
    providerType: NETWORK_TYPES.RINKEBY,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.RINKEBY,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.RINKEBY,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.RINKEBY],
    blockExplorerUrl: 'https://rinkeby.etherscan.io',
  },
  {
    labelKey: NETWORK_TYPES.GOERLI,
    iconColor: '#3099f2',
    providerType: NETWORK_TYPES.GOERLI,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.GOERLI,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.GOERLI,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    labelKey: NETWORK_TYPES.KOVAN,
    iconColor: '#9064FF',
    providerType: NETWORK_TYPES.KOVAN,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.KOVAN,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.KOVAN,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.KOVAN],
    blockExplorerUrl: 'https://kovan.etherscan.io',
  },
];

export { defaultNetworksData };
