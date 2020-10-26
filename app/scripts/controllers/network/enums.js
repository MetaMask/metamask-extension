export const MAINNET = 'mainnet'
export const TESTNET = 'testnet'
export const LOCALHOST = 'localhost'

// TODO: afterml
const MAINNET_LANCHED =
  new Date().getTime() >
  new Date('Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)').getTime()
export const MAINNET_CODE = MAINNET_LANCHED ? 1029 : 2
export const TESTNET_CODE = 0

export const MAINNET_DISPLAY_NAME = 'Conflux Main Network'
export const TESTNET_DISPLAY_NAME = 'Conflux Test Network'
