import { toChecksumAddress } from 'ethereumjs-util';
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
  checkExistingAddresses,
  isValidDomainName,
  isOriginContractAddress,
  isDefaultMetaMaskChain,
} from '../../../../helpers/utils/util';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';

export function getToErrorObject(to, sendTokenAddress, chainId) {
  let toError = null;
  if (!to) {
    toError = REQUIRED_ERROR;
  } else if (
    isBurnAddress(to) ||
    (!isValidHexAddress(to, { mixedCaseUseChecksum: true }) &&
      !isValidDomainName(to))
  ) {
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
    (toChecksumAddress(to) in contractMap || checkExistingAddresses(to, tokens))
  ) {
    toWarning = KNOWN_RECIPIENT_ADDRESS_ERROR;
  } else if (isValidDomainName(to) && isConfusing(to)) {
    toWarning = CONFUSING_ENS_ERROR;
  }

  return { to: toWarning };
}
