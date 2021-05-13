import {
  isHexString,
  isValidAddress,
  isValidChecksumAddress,
  addHexPrefix,
} from 'ethereumjs-util';

export const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';

export function isBurnAddress(address) {
  return address === BURN_ADDRESS;
}

export function isValidHexAddress(possibleAddress, allowNonPrefixed = true) {
  const addressToCheck = allowNonPrefixed
    ? addHexPrefix(possibleAddress)
    : possibleAddress;
  if (!isHexString(addressToCheck)) {
    return false;
  }

  const prefixRemoved = addressToCheck.slice(2);
  const lower = prefixRemoved.toLowerCase();
  const upper = prefixRemoved.toUpperCase();
  const allOneCase = prefixRemoved === lower || prefixRemoved === upper;
  if (!allOneCase) {
    return isValidChecksumAddress(addressToCheck);
  }

  return isValidAddress(addressToCheck);
}
