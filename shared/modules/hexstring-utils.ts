import {
  isHexString,
  isValidAddress,
  isValidChecksumAddress,
  addHexPrefix,
  toChecksumAddress,
  zeroAddress,
  isHexPrefixed,
} from 'ethereumjs-util';

export const BURN_ADDRESS = zeroAddress();

export function isBurnAddress(address: string) {
  return address === BURN_ADDRESS;
}

/**
 * Validates that the input is a hex address. This utility method is a thin
 * wrapper around ethereumjs-util.isValidAddress, with the exception that it
 * does not throw an error when provided values that are not hex strings. In
 * addition, and by default, this method will return true for hex strings that
 * meet the length requirement of a hex address, but are not prefixed with `0x`
 * Finally, if the mixedCaseUseChecksum flag is true and a mixed case string is
 * provided this method will validate it has the proper checksum formatting.
 *
 * @param possibleAddress - Input parameter to check against
 * @param [options] - options bag
 * @param [options.allowNonPrefixed] - If true will first ensure '0x'
 * is prepended to the string
 * @param [options.mixedCaseUseChecksum] - If true will treat mixed
 * case addresses as checksum addresses and validate that proper checksum
 * format is used
 * @returns whether or not the input is a valid hex address
 */
export function isValidHexAddress(
  possibleAddress: string,
  { allowNonPrefixed = true, mixedCaseUseChecksum = false } = {},
) {
  const addressToCheck = allowNonPrefixed
    ? addHexPrefix(possibleAddress)
    : possibleAddress;
  if (!isHexString(addressToCheck)) {
    return false;
  }

  if (mixedCaseUseChecksum) {
    const prefixRemoved = addressToCheck.slice(2);
    const lower = prefixRemoved.toLowerCase();
    const upper = prefixRemoved.toUpperCase();
    const allOneCase = prefixRemoved === lower || prefixRemoved === upper;
    if (!allOneCase) {
      return isValidChecksumAddress(addressToCheck);
    }
  }

  return isValidAddress(addressToCheck);
}

export function toChecksumHexAddress(address: string) {
  if (!address) {
    // our internal checksumAddress function that this method replaces would
    // return an empty string for nullish input. If any direct usages of
    // ethereumjs-util.toChecksumAddress were called with nullish input it
    // would have resulted in an error on version 5.1.
    return '';
  }
  const hexPrefixed = addHexPrefix(address);
  if (!isHexString(hexPrefixed)) {
    // Version 5.1 of ethereumjs-utils would have returned '0xY' for input 'y'
    // but we shouldn't waste effort trying to change case on a clearly invalid
    // string. Instead just return the hex prefixed original string which most
    // closely mimics the original behavior.
    return hexPrefixed;
  }
  return toChecksumAddress(hexPrefixed);
}

export function stripHexPrefix(str: string) {
  if (typeof str !== 'string') {
    return str;
  }
  return isHexPrefixed(str) ? str.slice(2) : str;
}
