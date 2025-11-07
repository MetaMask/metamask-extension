/**
 * Standalone Tron Address Validator (Synchronous)
 *
 * This utility validates Tron addresses in both Base58 and Hex formats.
 * It works in browser environments with js-sha256 library.
 *
 * Requirements:
 * Include js-sha256: <script src="https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js"></script>
 *
 * Usage:
 * import { isAddress } from './tron-address-validator';
 *
 * const isValid = isAddress('TRXaddress...'); // returns true or false (NO await needed!)
 */

import { is, string } from '@metamask/superstruct';
import { sha256 } from 'js-sha256';

// Constants
const ADDRESS_SIZE = 34;
const ADDRESS_PREFIX_BYTE = 0x41;

// Base58 alphabet
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};

for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}

const BASE = 58;

/**
 * Decodes a Base58 encoded string to a byte array
 *
 * @param str - The Base58 encoded string to decode
 * @returns The decoded byte array
 */
function decode58(str: string): number[] {
  if (str.length === 0) {
    return [];
  }

  let i: number;
  let j: number;

  const bytes = [0];

  for (i = 0; i < str.length; i++) {
    const c: string = str[i];

    if (!(c in ALPHABET_MAP)) {
      throw new Error('Non-base58 character');
    }

    for (j = 0; j < bytes.length; j++) {
      // eslint-disable-next-line no-bitwise
      bytes[j] *= BASE;
    }

    bytes[0] += ALPHABET_MAP[c];
    let carry = 0;

    for (j = 0; j < bytes.length; ++j) {
      bytes[j] += carry;
      // eslint-disable-next-line no-bitwise
      carry = bytes[j] >> 8;
      // eslint-disable-next-line no-bitwise
      bytes[j] &= 0xff;
    }

    while (carry) {
      // eslint-disable-next-line no-bitwise
      bytes.push(carry & 0xff);
      // eslint-disable-next-line no-bitwise
      carry >>= 8;
    }
  }

  for (i = 0; str[i] === '1' && i < str.length - 1; i++) {
    bytes.push(0);
  }

  return bytes.reverse();
}

/**
 * Encodes a byte array to Base58
 *
 * @param buffer - The byte array to encode
 * @returns The Base58 encoded string
 */
function encode58(buffer: number[] | Uint8Array | string): string {
  if (buffer.length === 0) {
    return '';
  }

  let i: number;
  let j: number;

  const digits = [0];

  for (i = 0; i < buffer.length; i++) {
    for (j = 0; j < digits.length; j++) {
      // eslint-disable-next-line no-bitwise
      digits[j] <<= 8;
    }

    const item = buffer[i];
    const byte = typeof item === 'string' ? item.charCodeAt(0) : item;
    digits[0] += byte;
    let carry = 0;

    for (j = 0; j < digits.length; ++j) {
      digits[j] += carry;
      // eslint-disable-next-line no-bitwise
      carry = (digits[j] / BASE) | 0;
      digits[j] %= BASE;
    }

    while (carry) {
      digits.push(carry % BASE);
      // eslint-disable-next-line no-bitwise
      carry = (carry / BASE) | 0;
    }
  }

  for (i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    digits.push(0);
  }

  return digits
    .reverse()
    .map((digit) => ALPHABET[digit])
    .join('');
}

/**
 * Checks if a character is a hex character
 *
 * @param c - The character to check
 * @returns 1 if hex character, 0 otherwise
 */
function isHexChar(c: string): number {
  if (
    (c >= 'A' && c <= 'F') ||
    (c >= 'a' && c <= 'f') ||
    (c >= '0' && c <= '9')
  ) {
    return 1;
  }

  return 0;
}

/**
 * Converts a hex character to a byte
 *
 * @param c - The hex character to convert
 * @returns The byte value
 */
function hexChar2byte(c: string): number {
  let d: number | undefined;

  if (c >= 'A' && c <= 'F') {
    d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  } else if (c >= 'a' && c <= 'f') {
    d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
  } else if (c >= '0' && c <= '9') {
    d = c.charCodeAt(0) - '0'.charCodeAt(0);
  }

  if (typeof d === 'number') {
    return d;
  }

  throw new Error('The passed hex char is not a valid hex char');
}

/**
 * Converts a hex string to a byte array
 *
 * @param str - The hex string to convert
 * @param strict - Whether to enforce strict hex format
 * @returns The byte array
 */
function hexStr2byteArray(str: string, strict = false): number[] {
  let hexString = str;
  let len = hexString.length;

  if (strict) {
    if (len % 2) {
      hexString = `0${hexString}`;
      len += 1;
    }
  }
  const byteArray: number[] = [];
  let d = 0;
  let j = 0;
  let k = 0;

  for (let i = 0; i < len; i++) {
    const c = hexString.charAt(i);

    if (isHexChar(c)) {
      // eslint-disable-next-line no-bitwise
      d <<= 4;
      d += hexChar2byte(c);
      j += 1;

      if (j % 2 === 0) {
        byteArray[k] = d;
        k += 1;
        d = 0;
      }
    } else {
      throw new Error('The passed hex char is not a valid hex string');
    }
  }

  return byteArray;
}

/**
 * SHA256 hash function using js-sha256 library
 *
 * @param msgBytes - The message bytes to hash
 * @returns The hash as a byte array
 */
function sha256Hash(msgBytes: number[] | Uint8Array): number[] {
  const hex = sha256.hex(msgBytes);
  return hexStr2byteArray(hex);
}

/**
 * Gets Base58Check address from address bytes
 *
 * @param addressBytes - The address bytes
 * @returns The Base58Check encoded address
 */
function getBase58CheckAddress(addressBytes: number[]): string {
  const hash0 = sha256Hash(addressBytes);
  const hash1 = sha256Hash(hash0);

  let checkSum = hash1.slice(0, 4);
  checkSum = addressBytes.concat(checkSum);

  return encode58(checkSum);
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

  let address = decode58(base58Str);

  if (address.length !== 25) {
    return false;
  }

  if (address[0] !== ADDRESS_PREFIX_BYTE) {
    return false;
  }

  const checkSum = address.slice(21);
  address = address.slice(0, 21);

  const hash0 = sha256Hash(address);
  const hash1 = sha256Hash(hash0);
  const checkSum1 = hash1.slice(0, 4);

  if (
    checkSum[0] === checkSum1[0] &&
    checkSum[1] === checkSum1[1] &&
    checkSum[2] === checkSum1[2] &&
    checkSum[3] === checkSum1[3]
  ) {
    return true;
  }

  return false;
}

/**
 * Validates if an address is a valid Tron address (synchronous)
 * Supports both Base58 format (e.g., TRXaddress...) and Hex format (e.g., 41hexaddress...)
 *
 * Requires js-sha256 library to be loaded globally.
 * Include: <script src="https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js"></script>
 *
 * @param address - The address to validate
 * @returns boolean - true if valid, false otherwise
 */
export function isTronAddress(address: string): boolean {
  // Validate that address is a string using superstruct
  if (!is(address, string())) {
    return false;
  }

  // Convert HEX to Base58
  if (address.length === 42) {
    try {
      // it throws an error if the address starts with 0x
      return isTronAddress(getBase58CheckAddress(hexStr2byteArray(address)));
    } catch (err) {
      return false;
    }
  }
  try {
    return isAddressValid(address);
  } catch (err) {
    return false;
  }
}
