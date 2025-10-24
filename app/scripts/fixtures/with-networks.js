import {
  ARBITRUM_DISPLAY_NAME,
  AVALANCHE_DISPLAY_NAME,
  BASE_DISPLAY_NAME,
  BNB_DISPLAY_NAME,
  CELO_DISPLAY_NAME,
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  GNOSIS_DISPLAY_NAME,
  infuraProjectId,
  LOCALHOST_DISPLAY_NAME,
  OPTIMISM_DISPLAY_NAME,
  POLYGON_DISPLAY_NAME,
  SEI_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
  ZK_SYNC_ERA_DISPLAY_NAME,
} from '../../../shared/constants/network';

export const FIXTURES_NETWORKS = {
  providerConfig: {
    chainId: '0xaa36a7',
    rpcPrefs: {
      blockExplorerUrl: 'https://sepolia.etherscan.io',
    },
    ticker: 'SepoliaETH',
    type: 'sepolia',
  },
  networkConfigurations: {
    networkConfigurationId: {
      chainId: '0xaa36a7',
      nickname: SEPOLIA_DISPLAY_NAME,
      rpcPrefs: {},
      rpcUrl: `https://sepolia.infura.io/v3/${infuraProjectId}`,
      ticker: 'SepoliaETH',
      networkConfigurationId: 'networkConfigurationId',
    },
    optimism: {
      chainId: CHAIN_IDS.OPTIMISM,
      id: 'optimism',
      nickname: OPTIMISM_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://optimistic.etherscan.io/',
        imageUrl: './images/optimism.svg',
      },
      rpcUrl: `https://optimism-mainnet.infura.io/v3/${infuraProjectId}`,
      ticker: CURRENCY_SYMBOLS.ETH,
    },
    base: {
      chainId: CHAIN_IDS.BASE,
      id: 'base',
      nickname: BASE_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://basescan.org',
        imageUrl: './images/base.svg',
      },
      rpcUrl: `https://base-mainnet.infura.io/v3/${infuraProjectId}`,
      ticker: CURRENCY_SYMBOLS.ETH,
    },
    polygon: {
      chainId: CHAIN_IDS.POLYGON,
      id: 'polygon',
      nickname: POLYGON_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://polygonscan.com/',
        imageUrl: './images/matic-token.svg',
      },
      rpcUrl: `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`,
      ticker: CURRENCY_SYMBOLS.MATIC,
    },
    binance: {
      chainId: CHAIN_IDS.BSC,
      id: 'binance',
      nickname: BNB_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://bscscan.com/',
        imageUrl: './images/bnb.svg',
      },
      rpcUrl: `https://bsc-mainnet.infura.io/v3/${infuraProjectId}`,
      ticker: CURRENCY_SYMBOLS.BNB,
    },
    gnosis: {
      id: 'gnosis',
      rpcUrl: 'https://rpc.gnosischain.com',
      chainId: CHAIN_IDS.GNOSIS,
      ticker: CURRENCY_SYMBOLS.GNOSIS,
      nickname: GNOSIS_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://gnosisscan.io',
        imageUrl: './images/gnosis.svg',
      },
    },
    arbitrum: {
      id: 'arbitrum',
      rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${infuraProjectId}`,
      chainId: CHAIN_IDS.ARBITRUM,
      ticker: CURRENCY_SYMBOLS.ETH,
      nickname: ARBITRUM_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://explorer.arbitrum.io',
        imageUrl: './images/arbitrum.svg',
      },
    },
    avalanche: {
      id: 'avalanche',
      rpcUrl: `https://avalanche-mainnet.infura.io/v3/${infuraProjectId}`,
      chainId: CHAIN_IDS.AVALANCHE,
      ticker: CURRENCY_SYMBOLS.AVALANCHE,
      nickname: AVALANCHE_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://snowtrace.io/',
        imageUrl: './images/avax-token.svg',
      },
    },
    celo: {
      id: 'celo',
      rpcUrl: `https://celo-mainnet.infura.io/v3/${infuraProjectId}`,
      chainId: CHAIN_IDS.CELO,
      ticker: CURRENCY_SYMBOLS.CELO,
      nickname: CELO_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://celoscan.io',
        imageUrl: './images/celo.svg',
      },
    },
    zkSync: {
      id: 'zkSync',
      rpcUrl: 'https://mainnet.era.zksync.io',
      chainId: CHAIN_IDS.ZKSYNC_ERA,
      ticker: CURRENCY_SYMBOLS.ETH,
      nickname: ZK_SYNC_ERA_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://explorer.zksync.io/',
        imageUrl: './images/zk-sync.svg',
      },
    },
    sei: {
      id: 'sei',
      rpcUrl: `https://sei-mainnet.infura.io/v3/${infuraProjectId}`,
      chainId: CHAIN_IDS.SEI,
      ticker: CURRENCY_SYMBOLS.SEI,
      nickname: SEI_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: 'https://seitrace.com/',
        imageUrl: './images/sei.svg',
      },
    },

    localhost: {
      id: 'localhost',
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
      ticker: 'ETH',
      nickname: LOCALHOST_DISPLAY_NAME,
      rpcPrefs: {
        blockExplorerUrl: '',
        imageUrl: '',
      },
    },
  },
};

export const ALL_POPULAR_NETWORKS = {
  eip155: {
    [CHAIN_IDS.MAINNET]: true,
    [CHAIN_IDS.LINEA_MAINNET]: true,
    [CHAIN_IDS.OPTIMISM]: true,
    [CHAIN_IDS.BASE]: true,
    [CHAIN_IDS.POLYGON]: true,
    [CHAIN_IDS.BSC]: true,
    [CHAIN_IDS.ARBITRUM]: true,
    [CHAIN_IDS.AVALANCHE]: true,
    [CHAIN_IDS.ZKSYNC_ERA]: true,
    [CHAIN_IDS.SEI]: true,
  },
};
