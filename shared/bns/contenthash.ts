/**
 * Minimal ENS-style contenthash → IPFS CID decoder for MetaMask BNS.
 *
 * Only IPFS namespace (`0xe3`) payloads are accepted. The resulting text CID is
 * re-validated with the same structural rules as BnesBrowser (`isValidCid`).
 */

import { isValidCid } from './security';

const IPFS_NAMESPACE = 0xe3;
const CIDV0_MULTIHASH_PREFIX = [0x12, 0x20] as const;
const CIDV0_BINARY_LENGTH = 34;

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * Encode bytes as Bitcoin-style base58 (CIDv0 multihash text form).
 *
 * @param bytes - Binary input.
 * @returns Base58 text.
 */
function encodeBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return '';
  }

  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}

/**
 * Encode bytes as lowercase base32 without padding (CIDv1 multibase body).
 *
 * @param bytes - Binary input.
 * @returns Lowercase base32 text.
 */
function encodeBase32Lower(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Strip an optional 0x prefix.
 *
 * @param value - Hex string.
 * @returns Hex without prefix.
 */
function stripHexPrefix(value: string): string {
  return value.startsWith('0x') || value.startsWith('0X')
    ? value.slice(2)
    : value;
}

/**
 * Convert hex or bytes to a Uint8Array.
 *
 * @param value - Hex string or bytes.
 * @returns Bytes, or null if invalid.
 */
function toBytes(value: string | Uint8Array): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const hex = stripHexPrefix(value.trim());
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert a binary CID (without ENS codec prefix) to gateway-safe text.
 *
 * @param cidBytes - CIDv0 multihash or CIDv1 binary.
 * @returns Text CID, or null.
 */
function binaryCidToText(cidBytes: Uint8Array): string | null {
  if (
    cidBytes.length === CIDV0_BINARY_LENGTH &&
    cidBytes[0] === CIDV0_MULTIHASH_PREFIX[0] &&
    cidBytes[1] === CIDV0_MULTIHASH_PREFIX[1]
  ) {
    const text = encodeBase58(cidBytes);
    return text || null;
  }

  if (cidBytes.length >= 4 && cidBytes[0] === 0x01) {
    return `b${encodeBase32Lower(cidBytes)}`;
  }

  return null;
}

/**
 * Decode an ENS contenthash into a path-gateway-safe IPFS CID string.
 * Returns null for empty, non-IPFS, or structurally invalid payloads.
 *
 * @param value - Hex contenthash or raw bytes from the resolver.
 * @returns Validated CID text, or null.
 */
export function decodeIpfsContenthash(
  value: string | Uint8Array,
): string | null {
  const bytes = toBytes(value);
  if (!bytes || bytes.length < 2 || bytes[0] !== IPFS_NAMESPACE) {
    return null;
  }

  const cidText = binaryCidToText(bytes.subarray(1));
  if (!cidText || !isValidCid(cidText)) {
    return null;
  }
  return cidText;
}
