import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from './enums'

// TODO: afterml
const standardNetworkId = {
  '1029': MAINNET_CHAIN_ID,
  '2': MAINNET_CHAIN_ID,
  '0': TESTNET_CHAIN_ID,
}

function selectChainId (metamaskState) {
  const {
    network,
    provider: { chainId },
  } = metamaskState
  // TODO: afterml
  const MAINNET_LANCHED =
    new Date().getTime() >
    new Date(
      'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
    ).getTime()
  if (MAINNET_LANCHED) {
    standardNetworkId['1029'] = '0x405'
  }
  return standardNetworkId[network] || `0x${parseInt(chainId, 10).toString(16)}`
}

export default selectChainId
