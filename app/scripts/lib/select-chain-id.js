const {
  MAINNET_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  KOVAN_CHAIN_ID,
  GOERLI_CHAIN_ID,
} = require('./enums')

const standardNetworkId = {
  '1': MAINNET_CHAIN_ID,
  '3': ROPSTEN_CHAIN_ID,
  '4': RINKEBY_CHAIN_ID,
  '42': KOVAN_CHAIN_ID,
  '5': GOERLI_CHAIN_ID,
}

function selectChainId (metamaskState) {
  const { network, provider: { chaindId } } = metamaskState
  return standardNetworkId[network] || `0x${parseInt(chaindId, 10).toString(16)}`
}

module.exports = selectChainId
