import punycode from 'punycode/punycode';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';
import {
  TRUNCATED_ADDRESS_START_CHARS,
  TRUNCATED_NAME_CHAR_LIMIT,
  TRUNCATED_ADDRESS_END_CHARS,
} from '../../../shared/constants/labels';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../app/scripts/lib/multichain/address';

/**
 * Shortens an address for display with customizable segment lengths
 *
 * @param address - Ethereum address to shorten
 * @param firstSegLength - Length of the first segment to show
 * @param lastSegLength - Length of the last segment to show
 * @param includeHex - Whether to include the '0x' prefix
 * @returns Shortened address string
 */
export function addressSummary(
  address?: string,
  firstSegLength = 10,
  lastSegLength = 4,
  includeHex = true,
): string {
  if (!address) {
    return '';
  }
  let checked = normalizeSafeAddress(address);
  if (!includeHex) {
    checked = stripHexPrefix(checked);
  }
  return checked
    ? `${checked.slice(0, firstSegLength)}...${checked.slice(
        checked.length - lastSegLength,
      )}`
    : '...';
}

/**
 * Validates if the input is a valid domain name
 *
 * @param address - Domain name to validate
 * @returns True if the domain name is valid
 */
export function isValidDomainName(address: string): boolean {
  const match = punycode
    .toASCII(address)
    .toLowerCase()
    // Checks that the domain consists of at least one valid domain pieces separated by periods, followed by a tld
    // Each piece of domain name has only the characters a-z, 0-9, and a hyphen (but not at the start or end of chunk)
    // A chunk has minimum length of 1, but minimum tld is set to 2 for now (no 1-character tlds exist yet)
    .match(
      /^(?:[a-z0-9](?:[-a-z0-9]*[a-z0-9])?\.)+[a-z0-9][-a-z0-9]*[a-z0-9]$/u,
    );

  return match !== null;
}

/**
 * Checks if the 'to' address matches the token contract address
 *
 * @param to - Destination address
 * @param sendTokenAddress - Token contract address
 * @returns True if the addresses match (case-insensitive)
 */
export function isOriginContractAddress(
  to?: string,
  sendTokenAddress?: string,
): boolean {
  if (!to || !sendTokenAddress) {
    return false;
  }
  return to.toLowerCase() === sendTokenAddress.toLowerCase();
}

/**
 * Shortens the given string, preserving the beginning and end
 * Returns the string if it is no longer than truncatedCharLimit
 *
 * @param stringToShorten - The string to shorten
 * @param options - Shortening options
 * @param options.truncatedCharLimit
 * @param options.truncatedStartChars
 * @param options.truncatedEndChars
 * @param options.skipCharacterInEnd
 * @returns The shortened string
 */
export function shortenString(
  stringToShorten = '',
  {
    truncatedCharLimit = TRUNCATED_NAME_CHAR_LIMIT,
    truncatedStartChars = TRUNCATED_ADDRESS_START_CHARS,
    truncatedEndChars = TRUNCATED_ADDRESS_END_CHARS,
    skipCharacterInEnd = false,
  } = {},
): string {
  if (stringToShorten.length < truncatedCharLimit) {
    return stringToShorten;
  }

  return `${stringToShorten.slice(0, truncatedStartChars)}...${
    skipCharacterInEnd ? '' : stringToShorten.slice(-truncatedEndChars)
  }`;
}

/**
 * Shortens an Ethereum address for display, preserving the beginning and end
 *
 * @param address - The address to shorten
 * @returns The shortened address
 */
export function shortenAddress(address = ''): string {
  return shortenString(address, {
    truncatedCharLimit: TRUNCATED_NAME_CHAR_LIMIT,
    truncatedStartChars: TRUNCATED_ADDRESS_START_CHARS,
    truncatedEndChars: TRUNCATED_ADDRESS_END_CHARS,
    skipCharacterInEnd: false,
  });
}

/**
 * Finds an account in an array by its address
 *
 * @param accounts - Array of accounts
 * @param targetAddress - Address to find
 * @returns The matching account or undefined
 */
export function getAccountByAddress(
  accounts: { address: string }[] = [],
  targetAddress: string = '',
) {
  return accounts.find(({ address }) => address === targetAddress);
}

/**
 * Checks whether an address is in a passed list of objects with address properties
 *
 * @param address - The hex address to check
 * @param list - The array of objects to check
 * @returns Whether or not the address is in the list
 */
export function checkExistingAddresses(
  address?: string,
  list: { address: string }[] = [],
): boolean {
  if (!address) {
    return false;
  }

  const matchesAddress = (obj: { address: string }) => {
    return obj.address.toLowerCase() === address.toLowerCase();
  };

  return list.some(matchesAddress);
}

/**
 * Extract and return first character (letter or number) of a provided string
 *
 * @param subjectName - Name of a subject
 * @returns Single character, chosen from the first character or number, question mark otherwise
 */
export const getAvatarFallbackLetter = (subjectName?: string): string => {
  return subjectName?.match(/[a-z0-9]/iu)?.[0] ?? '?';
};
