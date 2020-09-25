import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_CHECKSUM_ERROR,
  INVALID_RECIPIENT_0X_ERROR,
  INVALID_RECIPIENT_CONTRACT_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
} from '../../send.constants'

import {
  isAllOneCase,
  isValidAddress,
  isEthNetwork,
} from '../../../../helpers/utils/util'
import { isSmartContractAddress } from '../../../../helpers/utils/transactions.util'
import { checkExistingAddresses } from '../../../add-token/util'

import {
  toChecksumAddress,
  isValidChecksumAddress,
  isValidAddress as ethUtilIsValidAddress,
} from 'cfx-util'

export async function getToErrorObject (
  to,
  toError = null,
  hasHexData = false,
  _,
  __,
  network
) {
  if (!to) {
    if (!hasHexData) {
      toError = REQUIRED_ERROR
    }
  } else if (!ethUtilIsValidAddress(to) && !toError) {
    toError = isEthNetwork(network)
      ? INVALID_RECIPIENT_ADDRESS_ERROR
      : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR
  } else if (!isAllOneCase(to) && !isValidChecksumAddress(to) && !toError) {
    toError = isEthNetwork(network)
      ? INVALID_RECIPIENT_CHECKSUM_ERROR
      : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR
  } else if (
    !isValidAddress(to, 'account') &&
    !isValidAddress(to, 'contract') &&
    !toError
  ) {
    toError = isEthNetwork(network)
      ? INVALID_RECIPIENT_0X_ERROR
      : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR
  } else if (
    !isValidAddress(to, 'account') &&
    isValidAddress(to, 'contract') &&
    !(await isSmartContractAddress(to)) &&
    !toError
  ) {
    toError = isEthNetwork(network)
      ? INVALID_RECIPIENT_CONTRACT_ERROR
      : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR
  }

  return { to: toError }
}

export function getToWarningObject (
  to,
  toWarning = null,
  tokens = [],
  selectedToken = null,
  trustedTokenMap = {}
) {
  if (
    selectedToken &&
    (toChecksumAddress(to) in trustedTokenMap ||
      checkExistingAddresses(to, tokens))
  ) {
    toWarning = KNOWN_RECIPIENT_ADDRESS_ERROR
  }
  return { to: toWarning }
}
