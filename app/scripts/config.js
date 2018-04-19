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

global.METAMASK_DEBUG = process.env.METAMASK_DEBUG

/**
 * @typedef {Object} UrlConfig
 * @property {string} localhost URL of local RPC provider
 * @property {string} mainnet URL of mainnet RPC provider
 * @property {string} ropsten URL of Ropsten testnet RPC provider
 * @property {string} kovan URL of Kovan testnet RPC provider
 * @property {string} rinkeby URL of Rinkeby testnet RPC provider
 */

/**
 * @typedef {Object} NameConfig
 * @property {string} 3 URL of local RPC provider
 * @property {string} 4 URL of mainnet RPC provider
 * @property {string} 42 URL of Ropsten testnet RPC provider
 */

/**
 * @typedef {Object} EnumConfig
 * @property {string} DEFAULT_RPC Default network provider URL
 * @property {string} OLD_UI_NETWORK_TYPE Network associated with old UI
 * @property {string} BETA_UI_NETWORK_TYPE Network associated with new UI
 */

/**
 * @typedef {Object} Config
 * @property {UrlConfig} network Network configuration parameters
 * @property {UrlConfig} networkBeta Beta UI network configuration parameters
 * @property {NameConfig} networkNames Network name configuration parameters
 * @property {EnumConfig} enums Application-wide string constants
 */

/**
 * @type {Config}
 **/
const config = {
  network: {
    localhost: LOCALHOST_RPC_URL,
    mainnet: MAINET_RPC_URL,
    ropsten: ROPSTEN_RPC_URL,
    kovan: KOVAN_RPC_URL,
    rinkeby: RINKEBY_RPC_URL,
  },
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

module.exports = config
