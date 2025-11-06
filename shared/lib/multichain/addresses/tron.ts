/**
 * Standalone TRON Address Validator
 *
 * This utility validates TRON blockchain addresses in both Base58 and hex formats.
 * No external dependencies required.
 */

import { is, string } from '@metamask/superstruct';

// Constants
const ADDRESS_SIZE = 34;
const ADDRESS_PREFIX_BYTE = 0x41;
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};

// Build alphabet map
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}

const BASE = 58;

// Base58 encoding/decoding
function encode58(buffer: number[] | string): string {
  if (buffer.length === 0) {
    return '';
  }

  let i: number;
  let j: number;
  const digits = [0];

  const bufferArray: number[] =
    typeof buffer === 'string'
      ? Array.from(buffer).map((char) => char.charCodeAt(0))
      : buffer;

  // eslint-disable-next-line no-bitwise, @typescript-eslint/prefer-for-of
  for (i = 0; i < bufferArray.length; i++) {
    // eslint-disable-next-line no-bitwise
    for (j = 0; j < digits.length; j++) {
      // eslint-disable-next-line no-bitwise
      digits[j] <<= 8;
    }

    digits[0] += bufferArray[i];
    let carry = 0;

    // eslint-disable-next-line no-bitwise, no-plusplus
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

  // eslint-disable-next-line no-plusplus
  for (i = 0; bufferArray[i] === 0 && i < bufferArray.length - 1; i++) {
    digits.push(0);
  }

  return digits
    .reverse()
    .map((digit) => ALPHABET[digit])
    .join('');
}

function decode58(str: string): number[] {
  if (str.length === 0) {
    return [];
  }

  let i: number;
  let j: number;
  const bytes = [0];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of, no-plusplus
  for (i = 0; i < str.length; i++) {
    const c: string = str[i];

    if (!(c in ALPHABET_MAP)) {
      throw new Error('Non-base58 character');
    }

    for (j = 0; j < bytes.length; j++) {
      bytes[j] *= BASE;
    }

    bytes[0] += ALPHABET_MAP[c];
    let carry = 0;

    // eslint-disable-next-line no-bitwise, no-plusplus
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

  // eslint-disable-next-line no-plusplus
  for (i = 0; str[i] === '1' && i < str.length - 1; i++) {
    bytes.push(0);
  }

  return bytes.reverse();
}

// Byte array utilities
function byte2hexStr(byte: number): string {
  if (byte < 0 || byte > 255) {
    throw new Error('Input must be a byte');
  }

  const hexByteMap = '0123456789ABCDEF';
  let str = '';
  // eslint-disable-next-line no-bitwise
  str += hexByteMap.charAt(byte >> 4);
  // eslint-disable-next-line no-bitwise
  str += hexByteMap.charAt(byte & 0x0f);

  return str;
}

function byteArray2hexStr(byteArray: number[] | Uint8Array): string {
  let str = '';
  for (const byte of byteArray) {
    str += byte2hexStr(byte);
  }
  return str;
}

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

function hexStr2byteArray(str: string, strict = false): number[] {
  let processedStr = str;
  let len = str.length;

  if (strict) {
    if (len % 2) {
      processedStr = `0${str}`;
      len += 1;
    }
  }

  const byteArray: number[] = [];
  let d = 0;
  let j = 0;
  let k = 0;

  // eslint-disable-next-line @typescript-eslint/prefer-for-of, no-plusplus
  for (let i = 0; i < len; i++) {
    const c = processedStr.charAt(i);

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

// SHA256 - Note: This is a simplified implementation using Node.js crypto
// For browser environments, you'll need to use Web Crypto API or include a SHA256 library
function sha256(msgBytes: number[] | Uint8Array): number[] {
  // Check if we're in Node.js environment
  if (typeof process?.versions?.node !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
    const nodeCrypto = require('crypto');
    const msgHex = byteArray2hexStr(msgBytes);
    const hash = nodeCrypto
      .createHash('sha256')
      .update(Buffer.from(msgHex, 'hex'))
      .digest('hex');
    return hexStr2byteArray(hash);
  }
  // For browser environment, use Web Crypto API
  throw new Error(
    'Browser environment detected. Please use Web Crypto API for SHA256 or include a crypto library.',
  );
  // You would need to implement async Web Crypto API here or use a library like crypto-js
}

// Core validation functions
function getBase58CheckAddress(addressBytes: number[]): string {
  const hash0 = sha256(addressBytes);
  const hash1 = sha256(hash0);

  let checkSum = hash1.slice(0, 4);
  checkSum = addressBytes.concat(checkSum);

  return encode58(checkSum);
}

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

  const hash0 = sha256(address);
  const hash1 = sha256(hash0);
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
 * Validates a TRON address
 *
 * @param address - The address to validate (can be Base58 or hex format)
 * @returns true if the address is valid, false otherwise
 * @example
 * isAddress('TRX9Uhjxvb9tjfQHWQJKAQQaFcUx3N6TvT') // true
 * isAddress('41a614f803b6fd780986a42c78ec9c7f77e6ded13c') // true (hex format)
 * isAddress('invalid') // false
 */
export function isTronAddress(address: unknown): boolean {
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
