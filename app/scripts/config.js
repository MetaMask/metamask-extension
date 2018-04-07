const LOCALHOST_RPC_URL = 'http://localhost:8545'

const MAINET_RPC_URL_BETA = 'https://rpc.akroma.io'

const DEFAULT_RPC = 'mainnet'
const OLD_UI_NETWORK_TYPE = 'network'
const BETA_UI_NETWORK_TYPE = 'networkBeta'

global.METAMASK_DEBUG = process.env.METAMASK_DEBUG

module.exports = {
  network: {
    localhost: LOCALHOST_RPC_URL,
    mainnet: MAINET_RPC_URL_BETA,
  },
  // Used for beta UI
  networkBeta: {
    localhost: LOCALHOST_RPC_URL,
    mainnet: MAINET_RPC_URL_BETA,
  },
  networkNames: {
    200624: 'Akroma',
  },
  enums: {
    DEFAULT_RPC,
    OLD_UI_NETWORK_TYPE,
    BETA_UI_NETWORK_TYPE,
  },
}
