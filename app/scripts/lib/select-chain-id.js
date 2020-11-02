import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from './enums'

// TODO: afterml
const standardNetworkId = {
  '1029': MAINNET_CHAIN_ID,
  '1': TESTNET_CHAIN_ID,
}

function selectChainId (metamaskState) {
  const {
    network,
    provider: { chainId },
  } = metamaskState
  return standardNetworkId[network] || `0x${parseInt(chainId, 10).toString(16)}`
}

export default selectChainId
