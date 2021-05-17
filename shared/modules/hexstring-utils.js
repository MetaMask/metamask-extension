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

/**
 * Validates that the input is a hex address. This utility method is a thin
 * wrapper around ethereumjs-util.isValidAddress, with the exception that it
 * does not throw an error when provided values that are not hex strings. In
 * addition, and by default, this method will return true for hex strings that
 * meet the length requirement of a hex address, but are not prefixed with `0x`
 * Finally, if a mixed case string is provided this method assumes the address
 * is a checksum address and will validate it as such.
 * @param {string} possibleAddress - Input parameter to check against
 * @param {Object} [options] - options bag
 * @param {boolean} [options.allowNonPrefixed] - If true will first ensure '0x' is
 *  prepended to the string
 * @returns {boolean} whether or not the input is a valid hex address
 */
export function isValidHexAddress(
  possibleAddress,
  { allowNonPrefixed = true } = {},
) {
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
