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
    labelKey: NETWORK_TYPES.SEPOLIA,
    iconColor: '#CFB5F0',
    providerType: NETWORK_TYPES.SEPOLIA,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.SEPOLIA,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
  {
    labelKey: NETWORK_TYPES.LINEA_GOERLI,
    iconColor: '#61dfff',
    providerType: NETWORK_TYPES.LINEA_GOERLI,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.LINEA_GOERLI,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.LINEA_GOERLI,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_GOERLI],
    blockExplorerUrl: 'https://goerli.lineascan.build',
  },
  {
    labelKey: NETWORK_TYPES.LINEA_MAINNET,
    iconColor: '#121212',
    providerType: NETWORK_TYPES.LINEA_MAINNET,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.LINEA_MAINNET,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.LINEA_MAINNET,
    ticker: CURRENCY_SYMBOLS.ETH,
    blockExplorerUrl: 'https://lineascan.build',
  },
];

export { defaultNetworksData };
