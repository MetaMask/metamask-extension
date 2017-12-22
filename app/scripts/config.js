const MAINET_RPC_URL = 'https://mainnet.infura.io/metamask'
const ROPSTEN_RPC_URL = 'https://ropsten.infura.io/metamask'
const KOVAN_RPC_URL = 'https://kovan.infura.io/metamask'
const RINKEBY_RPC_URL = 'https://rinkeby.infura.io/metamask'
const LOCALHOST_RPC_URL = 'http://localhost:8545'

const MAINET_RPC_URL_BETA = 'https://mainnet.infura.io/metamask2'
const ROPSTEN_RPC_URL_BETA = 'https://ropsten.infura.io/metamask2'
const KOVAN_RPC_URL_BETA = 'https://kovan.infura.io/metamask2'
const RINKEBY_RPC_URL_BETA = 'https://rinkeby.infura.io/metamask2'

const DEFAULT_RPC = 'rinkeby'
const OLD_UI_NETWORK_TYPE = 'network'
const BETA_UI_NETWORK_TYPE = 'networkBeta'

global.METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

module.exports = {
  network: {
    localhost: LOCALHOST_RPC_URL,
    mainnet: MAINET_RPC_URL,
    ropsten: ROPSTEN_RPC_URL,
    kovan: KOVAN_RPC_URL,
    rinkeby: RINKEBY_RPC_URL,
  },
  // Used for beta UI
  networkBeta: {
    localhost: LOCALHOST_RPC_URL,
    mainnet: MAINET_RPC_URL_BETA,
    ropsten: ROPSTEN_RPC_URL_BETA,
    kovan: KOVAN_RPC_URL_BETA,
    rinkeby: RINKEBY_RPC_URL_BETA,
  },
  networkNames: {
    3: 'Ropsten',
    4: 'Rinkeby',
    42: 'Kovan',
  },
  enums: {
    DEFAULT_RPC,
    OLD_UI_NETWORK_TYPE,
    BETA_UI_NETWORK_TYPE,
  },
}
