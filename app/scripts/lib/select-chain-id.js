const standardNetworkId = {
  '1': '0x01',
  '3': '0x03',
  '4': '0x04',
  '42': '0x2a',
  '5': '0x05',
}

function selectChainId (metamaskState) {
  const { network, provider: { chaindId } } = metamaskState
  return standardNetworkId[network] || parseInt(chaindId, 10).toString(16)
}

module.exports = selectChainId
