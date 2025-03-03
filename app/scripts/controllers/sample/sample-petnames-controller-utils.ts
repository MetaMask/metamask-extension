import { Hex, isValidHexAddress } from '@metamask/utils';

/**
 * Checks if a string is a valid Ethereum address
 *
 * @param address - The address to validate
 * @returns True if the address is valid, false otherwise
 */
export const isEthAddress = (address: string): boolean => {
  return isValidHexAddress(address as Hex);
};

/**
 * Validates an Ethereum address
 *
 * @param address - The address to validate
 * @returns An error message if invalid, undefined if valid
 */
export const validateAddress = (address: string): string | undefined => {
  if (!address) {
    return 'Address is required';
  }

  if (!isValidHexAddress(address as Hex)) {
    return 'Invalid Ethereum address';
  }

  return undefined;
};

/**
 * Validates a petname
 *
 * @param name - The pet name to validate
 * @returns An error message if invalid, undefined if valid
 */
export const validatePetname = (name: string): string | undefined => {
  name = name.trim();

  if (!name) {
    return 'Pet name is required';
  }

  if (name.length > 12) {
    return `Pet name must be 12 characters or less`;
  }

  return undefined;
};

/**
 * Normalizes an Ethereum address (converts to lowercase)
 *
 * @param address - The address to normalize
 * @returns The normalized address
 */
export const normalizeAddress = (address: string): Hex => {
  return address.toLowerCase() as Hex;
};
