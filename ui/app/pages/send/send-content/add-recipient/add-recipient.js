import ethUtil from 'ethereumjs-util';
import contractMap from '@metamask/contract-metadata';
import { isConfusing } from 'unicode-confusables';
import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
  CONFUSING_ENS_ERROR,
  CONTRACT_ADDRESS_ERROR,
} from '../../send.constants';

import {
  isValidAddress,
  checkExistingAddresses,
  isValidDomainName,
  isOriginContractAddress,
  isDefaultMetaMaskChain,
} from '../../../../helpers/utils/util';

export function getToErrorObject(to, sendTokenAddress, chainId) {
  let toError = null;
  if (!to) {
    toError = REQUIRED_ERROR;
  } else if (!isValidAddress(to)) {
    toError = isDefaultMetaMaskChain(chainId)
      ? INVALID_RECIPIENT_ADDRESS_ERROR
      : INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR;
  } else if (isOriginContractAddress(to, sendTokenAddress)) {
    toError = CONTRACT_ADDRESS_ERROR;
  }

  return { to: toError };
}

export function getToWarningObject(to, tokens = [], sendToken = null) {
  let toWarning = null;
  if (
    sendToken &&
    (ethUtil.toChecksumAddress(to) in contractMap ||
      checkExistingAddresses(to, tokens))
  ) {
    toWarning = KNOWN_RECIPIENT_ADDRESS_ERROR;
  } else if (isValidDomainName(to) && isConfusing(to)) {
    toWarning = CONFUSING_ENS_ERROR;
  }

  return { to: toWarning };
}
