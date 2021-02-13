export const ROPSTEN = 'ropsten'
export const RINKEBY = 'rinkeby'
export const KOVAN = 'kovan'
export const MAINNET = 'mainnet'
export const GOERLI = 'goerli'
export const LOCALHOST = 'localhost'
export const CELO = 'celo'
export const ALFA = 'alfa'
export const BAKL = 'bakl'

export const MAINNET_NETWORK_ID = '1'
export const ROPSTEN_NETWORK_ID = '3'
export const RINKEBY_NETWORK_ID = '4'
export const GOERLI_NETWORK_ID = '5'
export const KOVAN_NETWORK_ID = '42'
export const CELO_NETWORK_ID = '42220'
export const BAKL_NETWORK_ID = '62320'
export const ALFA_NETWORK_ID = '44787'

export const MAINNET_CHAIN_ID = '0x1'
export const ROPSTEN_CHAIN_ID = '0x3'
export const RINKEBY_CHAIN_ID = '0x4'
export const GOERLI_CHAIN_ID = '0x5'
export const KOVAN_CHAIN_ID = '0x2a'
export const CELO_CHAIN_ID = '0xa4ec'
export const BAKL_CHAIN_ID = '0xf370'
export const ALFA_CHAIN_ID = '0xaef3'

export const ROPSTEN_DISPLAY_NAME = 'Ropsten'
export const RINKEBY_DISPLAY_NAME = 'Rinkeby'
export const KOVAN_DISPLAY_NAME = 'Kovan'
export const MAINNET_DISPLAY_NAME = 'Main Ethereum Network'
export const GOERLI_DISPLAY_NAME = 'Goerli'
export const CELO_DISPLAY_NAME = 'Main Celo Network'
export const ALFA_DISPLAY_NAME = 'Alfajores test Network'
export const BAKL_DISPLAY_NAME = 'Baklava test Network'

export const INFURA_PROVIDER_TYPES = [
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
  GOERLI,
]

export const NETWORK_TYPE_TO_ID_MAP = {
  [ROPSTEN]: { networkId: ROPSTEN_NETWORK_ID, chainId: ROPSTEN_CHAIN_ID },
  [RINKEBY]: { networkId: RINKEBY_NETWORK_ID, chainId: RINKEBY_CHAIN_ID },
  [KOVAN]: { networkId: KOVAN_NETWORK_ID, chainId: KOVAN_CHAIN_ID },
  [GOERLI]: { networkId: GOERLI_NETWORK_ID, chainId: GOERLI_CHAIN_ID },
  [MAINNET]: { networkId: MAINNET_NETWORK_ID, chainId: MAINNET_CHAIN_ID },
  [CELO]: { networkId: CELO_NETWORK_ID, chainId: CELO_CHAIN_ID },
  [ALFA]: { networkId: ALFA_NETWORK_ID, chainId: ALFA_CHAIN_ID },
  [BAKL]: { networkId: BAKL_NETWORK_ID, chainId: BAKL_CHAIN_ID },
}

export const NETWORK_TO_NAME_MAP = {
  [ROPSTEN]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY]: RINKEBY_DISPLAY_NAME,
  [KOVAN]: KOVAN_DISPLAY_NAME,
  [MAINNET]: MAINNET_DISPLAY_NAME,
  [GOERLI]: GOERLI_DISPLAY_NAME,
  [CELO]: CELO_DISPLAY_NAME,
  [ALFA]: ALFA_DISPLAY_NAME,
  [BAKL]: BAKL_DISPLAY_NAME,

  [ROPSTEN_NETWORK_ID]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY_NETWORK_ID]: RINKEBY_DISPLAY_NAME,
  [KOVAN_NETWORK_ID]: KOVAN_DISPLAY_NAME,
  [GOERLI_NETWORK_ID]: GOERLI_DISPLAY_NAME,
  [MAINNET_NETWORK_ID]: MAINNET_DISPLAY_NAME,
  [CELO_NETWORK_ID]: CELO_DISPLAY_NAME,
  [ALFA_NETWORK_ID]: ALFA_DISPLAY_NAME,
  [BAKL_NETWORK_ID]: BAKL_DISPLAY_NAME,

  [ROPSTEN_CHAIN_ID]: ROPSTEN_DISPLAY_NAME,
  [RINKEBY_CHAIN_ID]: RINKEBY_DISPLAY_NAME,
  [KOVAN_CHAIN_ID]: KOVAN_DISPLAY_NAME,
  [GOERLI_CHAIN_ID]: GOERLI_DISPLAY_NAME,
  [MAINNET_CHAIN_ID]: MAINNET_DISPLAY_NAME,
  [CELO_CHAIN_ID]: CELO_DISPLAY_NAME,
  [ALFA_CHAIN_ID]: ALFA_DISPLAY_NAME,
  [BAKL_CHAIN_ID]: BAKL_DISPLAY_NAME,
}
