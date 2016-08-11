const MAINET_RPC_URL = 'https://mainnet.infura.io/'
const TESTNET_RPC_URL = 'https://morden.infura.io/'
const DEFAULT_RPC_URL = TESTNET_RPC_URL
const CLASSIC_RPC_URL = 'https://mainnet-nf.infura.io/'
const DEVELOPMENT_MODE = false

module.exports = {
  network: {
    default: DEFAULT_RPC_URL,
    mainnet: MAINET_RPC_URL,
    testnet: TESTNET_RPC_URL,
    classic: CLASSIC_RPC_URL,
  },
  developmentMode: DEVELOPMENT_MODE,
}
