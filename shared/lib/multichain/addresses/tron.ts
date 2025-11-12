/**
 * Tron Address Validator
 *
 * This utility validates Tron addresses in both Base58 and Hex formats.
 * Uses @noble/hashes for SHA256 and @scure/base for Base58 encoding.
 */

import { is, string } from '@metamask/superstruct';
import { hexToBytes } from '@metamask/utils';
import { sha256 } from '@noble/hashes/sha256';
import { base58 } from '@scure/base';

// Constants
const ADDRESS_SIZE = 34;
const ADDRESS_PREFIX_BYTE = 0x41;

/**
 * SHA256 hash function
 *
 * @param msgBytes - The message bytes to hash
 * @returns The hash as a byte array
 */
function sha256Hash(msgBytes: Uint8Array): Uint8Array {
  return sha256(msgBytes);
}

/**
 * Gets Base58Check address from address bytes
 *
 * @param addressBytes - The address bytes
 * @returns The Base58Check encoded address
 */
function getBase58CheckAddress(addressBytes: Uint8Array): string {
  const hash0 = sha256Hash(addressBytes);
  const hash1 = sha256Hash(hash0);

  const checkSum = hash1.slice(0, 4);
  const addressWithChecksum = new Uint8Array(addressBytes.length + 4);
  addressWithChecksum.set(addressBytes);
  addressWithChecksum.set(checkSum, addressBytes.length);

  return base58.encode(addressWithChecksum);
}

/**
 * Validates if a Base58 string is a valid Tron address
 *
 * @param base58Str - The Base58 string to validate
 * @returns True if valid, false otherwise
 */
function isAddressValid(base58Str: string): boolean {
  if (typeof base58Str !== 'string') {
    return false;
  }

  if (base58Str.length !== ADDRESS_SIZE) {
    return false;
  }

  const decoded = base58.decode(base58Str);

  if (decoded.length !== 25) {
    return false;
  }

  if (decoded[0] !== ADDRESS_PREFIX_BYTE) {
    return false;
  }

  const payload = decoded.slice(0, 21);
  const checkSum = decoded.slice(21);

  const hash0 = sha256Hash(payload);
  const hash1 = sha256Hash(hash0);
  const expectedChecksum = hash1.slice(0, 4);

  // Compare checksums
  for (let i = 0; i < 4; i++) {
    if (checkSum[i] !== expectedChecksum[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validates if an address is a valid Tron address
 * Supports both Base58 format (e.g., TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
 * and Hex format without 0x prefix (e.g., 41a614f803b6fd780986a42c78ec9c7f77e6ded13c)
 *
 * @param address - The address to validate
 * @returns True if valid Tron address, false otherwise
 */
export function isTronAddress(address: string): boolean {
  // Validate that address is a string using superstruct
  if (!is(address, string())) {
    return false;
  }

  // Reject addresses with 0x prefix (not valid for TRON)
  if (address.startsWith('0x')) {
    return false;
  }

  // Handle hex format (42 chars without 0x prefix)
  if (address.length === 42) {
    try {
      const addressBytes = hexToBytes(`0x${address}`);
      return isTronAddress(getBase58CheckAddress(addressBytes));
    } catch (err) {
      return false;
    }
  }

  // Handle Base58 format
  try {
    return isAddressValid(address);
  } catch (err) {
    return false;
  }
}
