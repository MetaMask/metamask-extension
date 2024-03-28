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
    networkConfigurationId: '8338ca5f-ee9e-4401-91a0-ec7f91b4500f',
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
    networkConfigurationId: 'ba3e9f46-6298-49f5-9f95-2e614a534e75',
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
    networkConfigurationId: '8d92b66a-29b1-4b42-ba72-59393a6f30b7',
  },
  {
    labelKey: NETWORK_TYPES.LINEA_SEPOLIA,
    iconColor: '#61dfff',
    providerType: NETWORK_TYPES.LINEA_SEPOLIA,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.LINEA_SEPOLIA,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.LINEA_SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_SEPOLIA],
    blockExplorerUrl: 'https://sepolia.lineascan.build',
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
    networkConfigurationId: 'bddc16cf-0f58-44ac-9a8a-8aed20c4e147',
  },
];

export { defaultNetworksData };
