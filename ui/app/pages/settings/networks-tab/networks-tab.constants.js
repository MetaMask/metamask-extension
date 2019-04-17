const defaultNetworksData = [
  {
    labelKey: 'mainnet',
    iconColor: '#29B6AF',
    providerType: 'mainnet',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/mainnet',
    chainId: '1',
    ticker: 'ETH',
  },
  {
    labelKey: 'ropsten',
    iconColor: '#FF4A8D',
    providerType: 'ropsten',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/ropsten',
    chainId: '3',
    ticker: 'ETH',
  },
  {
    labelKey: 'kovan',
    iconColor: '#9064FF',
    providerType: 'kovan',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/kovan',
    chainId: '4',
    ticker: 'ETH',
  },
  {
    labelKey: 'rinkeby',
    iconColor: '#F6C343',
    providerType: 'rinkeby',
    rpcUrl: 'https://api.infura.io/v1/jsonrpc/rinkeby',
    chainId: '42',
    ticker: 'ETH',
  },
  {
    labelKey: 'localhost',
    iconColor: 'white',
    border: '1px solid #6A737D',
    providerType: 'localhost',
    rpcUrl: 'http://localhost:8545/',
  },
]

export {
  defaultNetworksData,
}
