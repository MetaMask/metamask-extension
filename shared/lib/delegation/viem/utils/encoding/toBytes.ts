/* eslint-disable no-plusplus */
import { BaseError } from '../../errors/base';
import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';
import { type IsHexErrorType, isHex } from '../data/isHex';
import { type PadErrorType, pad } from '../data/pad';

import { type AssertSizeErrorType, assertSize } from './fromHex';
import {
  type NumberToHexErrorType,
  type NumberToHexOpts,
  numberToHex,
} from './toHex';

/* eslint-disable-next-line spaced-comment */
const encoder = /*#__PURE__*/ new TextEncoder();

export type ToBytesParameters = {
  /** Size of the output bytes. */
  size?: number | undefined;
};

export type ToBytesErrorType =
  | NumberToBytesErrorType
  | BoolToBytesErrorType
  | HexToBytesErrorType
  | StringToBytesErrorType
  | IsHexErrorType
  | ErrorType;

/**
 * Encodes a UTF-8 string, hex value, bigint, number or boolean to a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes
 * - Example: https://viem.sh/docs/utilities/toBytes#usage
 *
 * @param value - Value to encode.
 * @param opts - Options.
 * @returns Byte array value.
 * @example
 * import { toBytes } from 'viem'
 * const data = toBytes('Hello world')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * @example
 * import { toBytes } from 'viem'
 * const data = toBytes(420)
 * // Uint8Array([1, 164])
 * @example
 * import { toBytes } from 'viem'
 * const data = toBytes(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 */
export function toBytes(
  value: string | bigint | number | boolean | Hex,
  opts: ToBytesParameters = {},
): ByteArray {
  if (typeof value === 'number' || typeof value === 'bigint') {
    return numberToBytes(value, opts);
  }
  if (typeof value === 'boolean') {
    return boolToBytes(value, opts);
  }
  if (isHex(value)) {
    return hexToBytes(value, opts);
  }
  return stringToBytes(value, opts);
}

export type BoolToBytesOpts = {
  /** Size of the output bytes. */
  size?: number | undefined;
};

export type BoolToBytesErrorType =
  | AssertSizeErrorType
  | PadErrorType
  | ErrorType;

/**
 * Encodes a boolean into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#booltobytes
 *
 * @param value - Boolean value to encode.
 * @param opts - Options.
 * @returns Byte array value.
 * @example
 * import { boolToBytes } from 'viem'
 * const data = boolToBytes(true)
 * // Uint8Array([1])
 * @example
 * import { boolToBytes } from 'viem'
 * const data = boolToBytes(true, { size: 32 })
 * // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
 */
export function boolToBytes(value: boolean, opts: BoolToBytesOpts = {}) {
  const bytes = new Uint8Array(1);
  bytes[0] = Number(value);
  if (typeof opts.size === 'number') {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { size: opts.size });
  }
  return bytes;
}

// We use very optimized technique to convert hex string to byte array
const charCodeMap = {
  zero: 48,
  nine: 57,
  A: 65,
  F: 70,
  a: 97,
  f: 102,
} as const;

function charCodeToBase16(char: number) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine) {
    return char - charCodeMap.zero;
  }
  if (char >= charCodeMap.A && char <= charCodeMap.F) {
    return char - (charCodeMap.A - 10);
  }
  if (char >= charCodeMap.a && char <= charCodeMap.f) {
    return char - (charCodeMap.a - 10);
  }
  return undefined;
}

export type HexToBytesOpts = {
  /** Size of the output bytes. */
  size?: number | undefined;
};

export type HexToBytesErrorType =
  | AssertSizeErrorType
  | PadErrorType
  | ErrorType;

/**
 * Encodes a hex string into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#hextobytes
 *
 * @param hex_ - Hex string to encode.
 * @param opts - Options.
 * @returns Byte array value.
 * @example
 * import { hexToBytes } from 'viem'
 * const data = hexToBytes('0x48656c6c6f20776f726c6421')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * @example
 * import { hexToBytes } from 'viem'
 * const data = hexToBytes('0x48656c6c6f20776f726c6421', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 */
export function hexToBytes(hex_: Hex, opts: HexToBytesOpts = {}): ByteArray {
  let hex = hex_;
  if (opts.size) {
    assertSize(hex, { size: opts.size });
    hex = pad(hex, { dir: 'right', size: opts.size });
  }

  let hexString = hex.slice(2) as string;
  if (hexString.length % 2) {
    hexString = `0${hexString}`;
  }

  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === undefined || nibbleRight === undefined) {
      throw new BaseError(
        `Invalid byte sequence ("${hexString[j - 2]}${
          hexString[j - 1]
        }" in "${hexString}").`,
      );
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}

export type NumberToBytesErrorType =
  | NumberToHexErrorType
  | HexToBytesErrorType
  | ErrorType;

/**
 * Encodes a number into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#numbertobytes
 *
 * @param value - Number to encode.
 * @param opts - Options.
 * @returns Byte array value.
 * @example
 * import { numberToBytes } from 'viem'
 * const data = numberToBytes(420)
 * // Uint8Array([1, 164])
 * @example
 * import { numberToBytes } from 'viem'
 * const data = numberToBytes(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 */
export function numberToBytes(
  value: bigint | number,
  opts?: NumberToHexOpts | undefined,
) {
  const hex = numberToHex(value, opts);
  return hexToBytes(hex);
}

export type StringToBytesOpts = {
  /** Size of the output bytes. */
  size?: number | undefined;
};

export type StringToBytesErrorType =
  | AssertSizeErrorType
  | PadErrorType
  | ErrorType;

/**
 * Encodes a UTF-8 string into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#stringtobytes
 *
 * @param value - String to encode.
 * @param opts - Options.
 * @returns Byte array value.
 * @example
 * import { stringToBytes } from 'viem'
 * const data = stringToBytes('Hello world!')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
 * @example
 * import { stringToBytes } from 'viem'
 * const data = stringToBytes('Hello world!', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 */
export function stringToBytes(
  value: string,
  opts: StringToBytesOpts = {},
): ByteArray {
  const bytes = encoder.encode(value);
  if (typeof opts.size === 'number') {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { dir: 'right', size: opts.size });
  }
  return bytes;
}
