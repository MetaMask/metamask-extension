const MAINET_RPC_URL = 'https://mainnet.infura.io/metamask'
const TESTNET_RPC_URL = 'https://rinkeby.infura.io/metamask'
const KOVAN_RPC_URL = 'https://kovan.infura.io/metamask'
const ROPSTEN_RPC_URL = 'https://ropsten.infura.io/metamask'
const DEFAULT_RPC_URL = TESTNET_RPC_URL

global.METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

module.exports = {
  network: {
    default: DEFAULT_RPC_URL,
    mainnet: MAINET_RPC_URL,
    testnet: TESTNET_RPC_URL,
    morden: TESTNET_RPC_URL,
    kovan: KOVAN_RPC_URL,
    ropsten: ROPSTEN_RPC_URL,
  },
}
