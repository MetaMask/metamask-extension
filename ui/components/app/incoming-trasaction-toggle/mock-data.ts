export const ALL_NETWORKS_DATA = [
  {
    chainId: '0x1',
    nickname: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    rpcPrefs: {
      imageUrl: './images/eth_logo.svg',
    },
    providerType: 'mainnet',
    ticker: 'ETH',
    id: 'mainnet',
    removable: false,
  },
  {
    chainId: '0xe708',
    nickname: 'Linea Mainnet',
    rpcUrl:
      'https://linea-mainnet.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    rpcPrefs: {
      imageUrl: './images/linea-logo-mainnet.svg',
    },
    providerType: 'linea-mainnet',
    id: 'linea-mainnet',
    removable: false,
  },
  {
    chainId: '0xfa',
    nickname: 'FANTOM',
    rpcPrefs: {},
    rpcUrl: 'http://ftmscan.com5',
    ticker: 'FTM',
  },
  {
    chainId: '0x5',
    nickname: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    providerType: 'goerli',
    ticker: 'GoerliETH',
    id: 'goerli',
    removable: false,
  },
  {
    chainId: '0xaa36a7',
    nickname: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    providerType: 'sepolia',
    ticker: 'SepoliaETH',
    id: 'sepolia',
    removable: false,
  },
  {
    chainId: '0xe704',
    nickname: 'Linea Goerli',
    rpcUrl:
      'https://linea-goerli.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
    rpcPrefs: {
      imageUrl: './images/linea-logo-testnet.png',
    },
    providerType: 'linea-goerli',
    ticker: 'LineaETH',
    id: 'linea-goerli',
    removable: false,
  },
];

export const INCOMING_DATA = {
  '0x1': true,
  '0xe708': false,
  '0xfa': true,
  '0x5': false,
  '0xaa36a7': true,
  '0xe704': true,
};
