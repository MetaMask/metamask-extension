import { cloneDeep } from 'lodash';

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
};

const INFURA_PROVIDER_TYPES = [
  NETWORK_TYPES.MAINNET,
  NETWORK_TYPES.GOERLI,
  NETWORK_TYPES.SEPOLIA,
  NETWORK_TYPES.LINEA_GOERLI,
  NETWORK_TYPES.LINEA_MAINNET,
];

const version = 51;

/**
 * Set the chainId in the Network Controller provider data for all infura networks
 */
export default {
  BUILT_IN_NETWORKS,
  INFURA_PROVIDER_TYPES,
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
  const { chainId, type } = state?.NetworkController?.provider || {};
  const enumChainId = BUILT_IN_NETWORKS[type]?.chainId;

  if (enumChainId && chainId !== enumChainId) {
    state.NetworkController.provider.chainId = enumChainId;
  }
  return state;
}
