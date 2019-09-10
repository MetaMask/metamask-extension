// types
const ROPSTEN = 'default#eth:ropsten'
const RINKEBY = 'default#eth:rinkeby'
const KOVAN = 'default#eth:kovan'
const MAINNET = 'default#eth:mainnet'
const LOCALHOST = 'default#eth:localhost'
const GOERLI = 'default#eth:goerli'
const CUSTOM_RPC = 'custom#eth:rpc'

// chain id
const MAINNET_CODE = 1
const ROPSTEN_CODE = 3
const RINKEBY_CODE = 4
const KOVAN_CODE = 42
const GOERLI_CODE = 5

// default names
const ROPSTEN_DISPLAY_NAME = 'Ropsten'
const RINKEBY_DISPLAY_NAME = 'Rinkeby'
const KOVAN_DISPLAY_NAME = 'Kovan'
const MAINNET_DISPLAY_NAME = 'Main Ethereum Network'
const GOERLI_DISPLAY_NAME = 'Goerli'

const DEFAULT_LIST = [
  {
    type: ROPSTEN,
    custom: {
      chainId: ROPSTEN_CODE,
      ticker: 'ETH',
    },
  },
  {
    type: RINKEBY,
    custom: {
      chainId: RINKEYBY_CODE,
      ticker: 'ETH',
    },
  },
  {
    type: KOVAN,
    custom: {
      chainId: KOVAN_CODE,
      ticker: 'ETH',
    },
  },
  {
    type: MAINNET,
    custom: {
      chainId: MAINNET_CODE,
      ticker: 'ETH',
    },
  },
  {
    type: LOCALHOST,
    custom: {
      ticker: 'ETH',
    },
  },
  {
    type: GOERLI,
    custom: {
      ticker: 'ETH',
      chainId: GOERLI_CODE,
    },
  },
]

module.exports = {
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
  LOCALHOST,
  GOERLI,
  CUSTOM_RPC,
  MAINNET_CODE,
  ROPSTEN_CODE,
  RINKEBY_CODE,
  KOVAN_CODE,
  GOERLI_CODE,
  ROPSTEN_DISPLAY_NAME,
  RINKEBY_DISPLAY_NAME,
  KOVAN_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  GOERLI_DISPLAY_NAME,
  DEFAULT_LIST,
}
