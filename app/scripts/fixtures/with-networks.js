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
      nickname: 'Sepolia',
      rpcPrefs: {},
      rpcUrl: 'https://sepolia.infura.io/v3/',
      ticker: 'SepoliaETH',
      networkConfigurationId: 'networkConfigurationId',
    },
    optimism: {
      chainId: '0xa',
      id: 'optimism',
      nickname: 'OP Mainnet',
      rpcPrefs: {
        blockExplorerUrl: 'https://optimistic.etherscan.io/',
        imageUrl: './images/optimism.svg',
      },
      rpcUrl: 'https://optimism-mainnet.infura.io/v3/',
      ticker: 'ETH',
    },
    base: {
      chainId: '0x2105',
      id: 'base',
      nickname: 'Base Mainnet',
      rpcPrefs: {
        blockExplorerUrl: 'https://basescan.org',
        imageUrl: './images/base.svg',
      },
      rpcUrl: 'https://mainnet.base.org',
      ticker: 'ETH',
    },
    polygon: {
      chainId: '0x89',
      id: 'polygon',
      nickname: 'Polygon Mainnet',
      rpcPrefs: {
        blockExplorerUrl: 'https://polygonscan.com/',
        imageUrl: './images/matic-token.svg',
      },
      rpcUrl: 'https://polygon-mainnet.infura.io/v3/',
      ticker: 'MATIC',
    },
    binance: {
      chainId: '0x38',
      id: 'binance',
      nickname: 'BNB Chain',
      rpcPrefs: {
        blockExplorerUrl: 'https://bscscan.com/',
        imageUrl: './images/bnb.svg',
      },
      rpcUrl: 'https://bsc-dataseed.binance.org/',
      ticker: 'BNB',
    },
    gnosis: {
      id: 'gnosis',
      rpcUrl: 'https://rpc.gnosischain.com',
      chainId: '0x64',
      ticker: 'XDAI',
      nickname: 'Gnosis',
      rpcPrefs: {
        blockExplorerUrl: 'https://gnosisscan.io',
        imageUrl: './images/gnosis.svg',
      },
    },
    arbitrum: {
      id: 'arbitrum',
      rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/',
      chainId: '0xa4b1',
      ticker: 'ETH',
      nickname: 'Arbitrum One',
      rpcPrefs: {
        blockExplorerUrl: 'https://explorer.arbitrum.io',
        imageUrl: './images/arbitrum.svg',
      },
    },
    avalanche: {
      id: 'avalanche',
      rpcUrl: 'https://avalanche-mainnet.infura.io/v3/',
      chainId: '0xa86a',
      ticker: 'AVAX',
      nickname: 'Avalanche',
      rpcPrefs: {
        blockExplorerUrl: 'https://snowtrace.io/',
        imageUrl: './images/avax-token.svg',
      },
    },
    celo: {
      id: 'celo',
      rpcUrl: 'https://celo-mainnet.infura.io/v3/',
      chainId: '0xa4ec',
      ticker: 'CELO',
      nickname: 'Celo Mainnet',
      rpcPrefs: {
        blockExplorerUrl: 'https://celoscan.io',
        imageUrl: './images/celo.svg',
      },
    },
    zkSync: {
      id: 'zkSync',
      rpcUrl: 'https://mainnet.era.zksync.io',
      chainId: '0x144',
      ticker: 'ETH',
      nickname: 'zkSync Era Mainnet',
      rpcPrefs: {
        blockExplorerUrl: 'https://explorer.zksync.io/',
        imageUrl: './images/zk-sync.svg',
      },
    },
    localhost: {
      id: 'localhost',
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
      ticker: 'ETH',
      nickname: 'Localhost 8545',
      rpcPrefs: {
        blockExplorerUrl: '',
        imageUrl: '',
      },
    },
  },
};
