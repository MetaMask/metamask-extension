const defaultNetworksData = [
  {
    labelKey: 'mainnet',
    iconColor: '#4890cc',
    providerType: 'mainnet',
    rpcUrl: 'http://wallet-main.confluxrpc.org',
    ticker: 'CFX',
    blockExplorerUrl: 'https://confluxscan.io',
  },
  {
    labelKey: 'testnet',
    iconColor: '#FF4A8D',
    providerType: 'testnet',
    rpcUrl: 'http://wallet-test.confluxrpc.org',
    ticker: 'CFX',
    blockExplorerUrl: 'https://confluxscan.io',
  },
  // {
  //   labelKey: 'mainnet',
  //   iconColor: '#29B6AF',
  //   providerType: 'mainnet',
  //   rpcUrl: 'https://api.infura.io/v1/jsonrpc/mainnet',
  //   chainId: '1',
  //   ticker: 'ETH',
  //   blockExplorerUrl: 'https://etherscan.io',
  // },
  {
    labelKey: 'localhost',
    iconColor: 'white',
    providerType: 'localhost',
    rpcUrl: 'http://localhost:12539/',
    // border: '1px solid #6A737D',
    ticker: 'CFX',
    blockExplorerUrl: 'https://confluxscan.io',
  },
]

export { defaultNetworksData }
