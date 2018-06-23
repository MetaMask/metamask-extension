import abi from 'human-standard-token-abi'
import abiDecoder from 'abi-decoder'
abiDecoder.addABI(abi)

export function isConfirmDeployContract (txData = {}) {
  const { txParams = {} } = txData
  return !txParams.to
}

export function getTokenData (data = {}) {
  return abiDecoder.decodeMethod(data)
}
