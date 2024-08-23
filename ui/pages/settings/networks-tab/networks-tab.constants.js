import {
  getRpcUrl,
  TEST_NETWORK_TICKER_MAP,
  CURRENCY_SYMBOLS,
  CHAIN_IDS,
  NETWORK_TYPES,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
  LINEA_SEPOLIA_DISPLAY_NAME,
  LINEA_MAINNET_DISPLAY_NAME,
} from '../../../../shared/constants/network';

const defaultNetworksData = [
  {
    labelKey: NETWORK_TYPES.MAINNET,
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    iconColor: '#29B6AF', // third party color
    providerType: NETWORK_TYPES.MAINNET,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.MAINNET,
      excludeProjectId: true,
    }),
    name: MAINNET_DISPLAY_NAME,
    chainId: CHAIN_IDS.MAINNET,
    ticker: CURRENCY_SYMBOLS.ETH,
    blockExplorerUrl: 'https://etherscan.io',
    rpcUrls: {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          url: getRpcUrl({
            network: NETWORK_TYPES.MAINNET,
            excludeProjectId: true,
          }),
        },
      ],
    },
  },
  {
    labelKey: NETWORK_TYPES.SEPOLIA,
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    iconColor: '#CFB5F0', // third party color
    providerType: NETWORK_TYPES.SEPOLIA,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.SEPOLIA,
      excludeProjectId: true,
    }),
    chainId: CHAIN_IDS.SEPOLIA,
    name: SEPOLIA_DISPLAY_NAME,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    rpcUrls: {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          url: getRpcUrl({
            network: NETWORK_TYPES.SEPOLIA,
            excludeProjectId: true,
          }),
        },
      ],
    },
  },
  {
    labelKey: NETWORK_TYPES.LINEA_SEPOLIA,
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    iconColor: '#61dfff', // third party color
    providerType: NETWORK_TYPES.LINEA_SEPOLIA,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.LINEA_SEPOLIA,
      excludeProjectId: true,
    }),
    name: LINEA_SEPOLIA_DISPLAY_NAME,
    chainId: CHAIN_IDS.LINEA_SEPOLIA,
    ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_SEPOLIA],
    blockExplorerUrl: 'https://sepolia.lineascan.build',
    rpcUrls: {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          url: getRpcUrl({
            network: NETWORK_TYPES.LINEA_SEPOLIA,
            excludeProjectId: true,
          }),
        },
      ],
    },
  },
  {
    labelKey: NETWORK_TYPES.LINEA_MAINNET,
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    iconColor: '#121212', // third party color
    providerType: NETWORK_TYPES.LINEA_MAINNET,
    rpcUrl: getRpcUrl({
      network: NETWORK_TYPES.LINEA_MAINNET,
      excludeProjectId: true,
    }),
    name: LINEA_MAINNET_DISPLAY_NAME,
    chainId: CHAIN_IDS.LINEA_MAINNET,
    ticker: CURRENCY_SYMBOLS.ETH,
    blockExplorerUrl: 'https://lineascan.build',
    rpcUrls: {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          url: getRpcUrl({
            network: NETWORK_TYPES.LINEA_MAINNET,
            excludeProjectId: true,
          }),
        },
      ],
    },
  },
];

export { defaultNetworksData };
