const MAINET_RPC_URL = 'https://mainnet.infura.io/metamask'
const ROPSTEN_RPC_URL = 'https://ropsten.infura.io/metamask'
const KOVAN_RPC_URL = 'https://kovan.infura.io/metamask'
const RINKEBY_RPC_URL = 'https://rinkeby.infura.io/metamask'
const EXPANSE_RPC_URL = "http://staging.expanse.tech:9656"

global.METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

module.exports = {
  network: {
    mainnet: MAINET_RPC_URL,
    ropsten: ROPSTEN_RPC_URL,
    kovan: KOVAN_RPC_URL,
    rinkeby: RINKEBY_RPC_URL,
    expanse: EXPANSE_RPC_URL,
  },
}
