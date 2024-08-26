export const ALL_NETWORKS_DATA = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        url: 'https://mainnet.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
        type: 'infura',
        networkClientId: 'mainnet',
      },
    ],
  },
  '0xe708': {
    chainId: '0xe708',
    name: 'Linea Mainnet',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        url: 'https://linea-mainnet.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
        type: 'infura',
        networkClientId: 'linea-mainnet',
      },
    ],
  },
  '0xfa': {
    chainId: '0xfa',
    name: 'FANTOM',
    nativeCurrency: 'FTM',
    rpcEndpoints: [
      {
        url: 'http://ftmscan.com5',
        type: 'custom',
        networkClientId: 'fantom-network-client-id',
      },
    ],
  },
  '0x5': {
    chainId: '0x5',
    name: 'Goerli',
    nativeCurrency: 'GoerliETH',
    rpcEndpoints: [
      {
        url: 'https://goerli.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
        type: 'infura',
        networkClientId: 'goerli',
      },
    ],
  },
  '0xaa36a7': {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    rpcEndpoints: [
      {
        url: 'https://sepolia.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
        type: 'infura',
        networkClientId: 'sepolia',
      },
    ],
  },
  '0xe704': {
    chainId: '0xe704',
    name: 'Linea Goerli',
    nativeCurrency: 'LineaETH',
    rpcEndpoints: [
      {
        url: 'https://linea-goerli.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
        type: 'infura',
        networkClientId: 'linea-goerli',
      },
    ],
  },
  '0xe705': {
    chainId: '0xe705',
    name: 'Linea Sepolia',
    nativeCurrency: 'LineaETH',
    rpcEndpoints: [
      {
        url: 'https://linea-sepolia.infura.io/v3/6c21df2a8dcb4a77b9bbcc1b65ee9ded',
        type: 'infura',
        networkClientId: 'linea-sepolia',
      },
    ],
  },
};

export const INCOMING_DATA = {
  '0x1': true,
  '0xe708': false,
  '0xfa': true,
  '0x5': false,
  '0xaa36a7': true,
  '0xe704': true,
  '0xe705': true,
};
