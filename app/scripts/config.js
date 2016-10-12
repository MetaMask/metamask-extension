const MAINET_RPC_URL = 'https://mainnet.infura.io/metamask'
const TESTNET_RPC_URL = 'https://morden.infura.io/metamask'
const DEFAULT_RPC_URL = TESTNET_RPC_URL

global.METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
global.TOS_HASH = 'GULP_TOS_HASH'

module.exports = {
  network: {
    default: DEFAULT_RPC_URL,
    mainnet: MAINET_RPC_URL,
    testnet: TESTNET_RPC_URL,
  },
}
