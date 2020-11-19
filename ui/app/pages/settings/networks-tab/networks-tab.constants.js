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
} from '../../../../../app/scripts/controllers/network/enums'

const defaultNetworksData = [
  {
    labelKey: MAINNET,
    iconColor: '#29B6AF',
    providerType: MAINNET,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    chainId: MAINNET_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
  },
  {
    labelKey: ROPSTEN,
    iconColor: '#FF4A8D',
    providerType: ROPSTEN,
    rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    chainId: ROPSTEN_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://ropsten.etherscan.io',
  },
  {
    labelKey: RINKEBY,
    iconColor: '#F6C343',
    providerType: RINKEBY,
    rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    chainId: RINKEBY_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://rinkeby.etherscan.io',
  },
  {
    labelKey: GOERLI,
    iconColor: '#3099f2',
    providerType: GOERLI,
    rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    chainId: GOERLI_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
  },
  {
    labelKey: KOVAN,
    iconColor: '#9064FF',
    providerType: KOVAN,
    rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    chainId: KOVAN_CHAIN_ID,
    ticker: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
  },
]

export { defaultNetworksData }
