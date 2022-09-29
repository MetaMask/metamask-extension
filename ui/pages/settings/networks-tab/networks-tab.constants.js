import {
  GOERLI,
  GOERLI_CHAIN_ID,
  MAINNET,
  MAINNET_CHAIN_ID,
  SEPOLIA,
  SEPOLIA_CHAIN_ID,
  getRpcUrl,
  ETH_SYMBOL,
  TEST_NETWORK_TICKER_MAP,
} from '../../../../shared/constants/network';

const defaultNetworksData = [
  {
    labelKey: MAINNET,
    iconColor: '#29B6AF',
    providerType: MAINNET,
    rpcUrl: getRpcUrl({ network: MAINNET, excludeProjectId: true }),
    chainId: MAINNET_CHAIN_ID,
    ticker: ETH_SYMBOL,
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    labelKey: GOERLI,
    iconColor: '#3099f2',
    providerType: GOERLI,
    rpcUrl: getRpcUrl({ network: GOERLI, excludeProjectId: true }),
    chainId: GOERLI_CHAIN_ID,
    ticker: TEST_NETWORK_TICKER_MAP[GOERLI],
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    labelKey: SEPOLIA,
    iconColor: '#CFB5F0',
    providerType: SEPOLIA,
    rpcUrl: getRpcUrl({
      network: SEPOLIA,
      excludeProjectId: true,
    }),
    chainId: SEPOLIA_CHAIN_ID,
    ticker: TEST_NETWORK_TICKER_MAP[SEPOLIA],
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
];

export { defaultNetworksData };
