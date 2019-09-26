const {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
} = require('../../send.constants')
const { isValidAddress, isEthNetwork } = require('../../../../helpers/utils/util')
import { checkExistingAddresses } from '../../../add-token/util'

const ethUtil = require('ethereumjs-util')
const contractMap = require('eth-contract-metadata')

function getToErrorObject (to, toError = null, hasHexData = false, _, __, network) {
  if (!to) {
    if (!hasHexData) {
      toError = REQUIRED_ERROR
    }
  } else if (!isValidAddress(to, network) && !toError) {
    toError = isEthNetwork(network) ? INVALID_RECIPIENT_ADDRESS_ERROR : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR
  }

  return { to: toError }
}

function getToWarningObject (to, toWarning = null, tokens = [], selectedToken = null) {
  if (selectedToken && (ethUtil.toChecksumAddress(to) in contractMap || checkExistingAddresses(to, tokens))) {
    toWarning = KNOWN_RECIPIENT_ADDRESS_ERROR
  }
  return { to: toWarning }
}

module.exports = {
  getToErrorObject,
  getToWarningObject,
}
