import {
  GOERLI,
  GOERLI_CHAIN_ID,
  KOVAN,
  KOVAN_CHAIN_ID,
  MAINNET,
  MAINNET_CHAIN_ID,
  RINKEBY,
  RINKEBY_CHAIN_ID,
  ROPSTEN,
  ROPSTEN_CHAIN_ID,
  getRpcUrl,
} from '../../../../shared/constants/network';

const defaultNetworksData = [
  {
    labelKey: MAINNET,
    iconColor: '#29B6AF',
    providerType: MAINNET,
    rpcUrl: getRpcUrl({ network: MAINNET, excludeProjectId: true }),
    chainId: MAINNET_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    labelKey: ROPSTEN,
    iconColor: '#FF4A8D',
    providerType: ROPSTEN,
    rpcUrl: getRpcUrl({ network: ROPSTEN, excludeProjectId: true }),
    chainId: ROPSTEN_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://ropsten.etherscan.io',
  },
  {
    labelKey: RINKEBY,
    iconColor: '#F6C343',
    providerType: RINKEBY,
    rpcUrl: getRpcUrl({ network: RINKEBY, excludeProjectId: true }),
    chainId: RINKEBY_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://rinkeby.etherscan.io',
  },
  {
    labelKey: GOERLI,
    iconColor: '#3099f2',
    providerType: GOERLI,
    rpcUrl: getRpcUrl({ network: GOERLI, excludeProjectId: true }),
    chainId: GOERLI_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    labelKey: KOVAN,
    iconColor: '#9064FF',
    providerType: KOVAN,
    rpcUrl: getRpcUrl({ network: KOVAN, excludeProjectId: true }),
    chainId: KOVAN_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://kovan.etherscan.io',
  },
];

export { defaultNetworksData };
