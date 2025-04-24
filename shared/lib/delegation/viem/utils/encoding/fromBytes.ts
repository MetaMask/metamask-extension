import { InvalidBytesBooleanError } from '../../errors/encoding';
import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';
import { type TrimErrorType, trim } from '../data/trim';

import {
  type AssertSizeErrorType,
  type HexToBigIntErrorType,
  type HexToNumberErrorType,
  assertSize,
  hexToBigInt,
  hexToNumber,
} from './fromHex';
import { type BytesToHexErrorType, bytesToHex } from './toHex';

export type FromBytesParameters<
  to extends 'string' | 'hex' | 'bigint' | 'number' | 'boolean',
> =
  | to
  | {
      /** Size of the bytes. */
      size?: number | undefined;
      /** Type to convert to. */
      to: to;
    };

export type FromBytesReturnType<to> = to extends 'string'
  ? string
  : to extends 'hex'
  ? Hex
  : to extends 'bigint'
  ? bigint
  : to extends 'number'
  ? number
  : to extends 'boolean'
  ? boolean
  : never;

export type FromBytesErrorType =
  | BytesToHexErrorType
  | BytesToBigIntErrorType
  | BytesToBoolErrorType
  | BytesToNumberErrorType
  | BytesToStringErrorType
  | ErrorType;

/**
 * Decodes a byte array into a UTF-8 string, hex value, number, bigint or boolean.
 *
 * - Docs: https://viem.sh/docs/utilities/fromBytes
 * - Example: https://viem.sh/docs/utilities/fromBytes#usage
 *
 * @param bytes Byte array to decode.
 * @param toOrOpts Type to convert to or options.
 * @returns Decoded value.
 *
 * @example
 * import { fromBytes } from 'viem'
 * const data = fromBytes(new Uint8Array([1, 164]), 'number')
 * // 420
 *
 * @example
 * import { fromBytes } from 'viem'
 * const data = fromBytes(
 *   new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]),
 *   'string'
 * )
 * // 'Hello world'
 */
export function fromBytes<
  to extends 'string' | 'hex' | 'bigint' | 'number' | 'boolean',
>(
  bytes: ByteArray,
  toOrOpts: FromBytesParameters<to>,
): FromBytesReturnType<to> {
  const opts = typeof toOrOpts === 'string' ? { to: toOrOpts } : toOrOpts;
  const to = opts.to;

  if (to === 'number')
    return bytesToNumber(bytes, opts) as FromBytesReturnType<to>;
  if (to === 'bigint')
    return bytesToBigInt(bytes, opts) as FromBytesReturnType<to>;
  if (to === 'boolean')
    return bytesToBool(bytes, opts) as FromBytesReturnType<to>;
  if (to === 'string')
    return bytesToString(bytes, opts) as FromBytesReturnType<to>;
  return bytesToHex(bytes, opts) as FromBytesReturnType<to>;
}

export type BytesToBigIntOpts = {
  /** Whether or not the number of a signed representation. */
  signed?: boolean | undefined;
  /** Size of the bytes. */
  size?: number | undefined;
};

export type BytesToBigIntErrorType =
  | BytesToHexErrorType
  | HexToBigIntErrorType
  | ErrorType;

/**
 * Decodes a byte array into a bigint.
 *
 * - Docs: https://viem.sh/docs/utilities/fromBytes#bytestobigint
 *
 * @param bytes Byte array to decode.
 * @param opts Options.
 * @returns BigInt value.
 *
 * @example
 * import { bytesToBigInt } from 'viem'
 * const data = bytesToBigInt(new Uint8Array([1, 164]))
 * // 420n
 */
export function bytesToBigInt(
  bytes: ByteArray,
  opts: BytesToBigIntOpts = {},
): bigint {
  if (typeof opts.size !== 'undefined') assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToBigInt(hex, opts);
}

export type BytesToBoolOpts = {
  /** Size of the bytes. */
  size?: number | undefined;
};

export type BytesToBoolErrorType =
  | AssertSizeErrorType
  | TrimErrorType
  | ErrorType;

/**
 * Decodes a byte array into a boolean.
 *
 * - Docs: https://viem.sh/docs/utilities/fromBytes#bytestobool
 *
 * @param bytes Byte array to decode.
 * @param opts Options.
 * @returns Boolean value.
 *
 * @example
 * import { bytesToBool } from 'viem'
 * const data = bytesToBool(new Uint8Array([1]))
 * // true
 */
export function bytesToBool(
  bytes_: ByteArray,
  opts: BytesToBoolOpts = {},
): boolean {
  let bytes = bytes_;
  if (typeof opts.size !== 'undefined') {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes);
  }
  if (bytes.length > 1 || bytes[0] > 1)
    throw new InvalidBytesBooleanError(bytes);
  return Boolean(bytes[0]);
}

export type BytesToNumberOpts = BytesToBigIntOpts;

export type BytesToNumberErrorType =
  | BytesToHexErrorType
  | HexToNumberErrorType
  | ErrorType;

/**
 * Decodes a byte array into a number.
 *
 * - Docs: https://viem.sh/docs/utilities/fromBytes#bytestonumber
 *
 * @param bytes Byte array to decode.
 * @param opts Options.
 * @returns Number value.
 *
 * @example
 * import { bytesToNumber } from 'viem'
 * const data = bytesToNumber(new Uint8Array([1, 164]))
 * // 420
 */
export function bytesToNumber(
  bytes: ByteArray,
  opts: BytesToNumberOpts = {},
): number {
  if (typeof opts.size !== 'undefined') assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToNumber(hex, opts);
}

export type BytesToStringOpts = {
  /** Size of the bytes. */
  size?: number | undefined;
};

export type BytesToStringErrorType =
  | AssertSizeErrorType
  | TrimErrorType
  | ErrorType;

/**
 * Decodes a byte array into a UTF-8 string.
 *
 * - Docs: https://viem.sh/docs/utilities/fromBytes#bytestostring
 *
 * @param bytes Byte array to decode.
 * @param opts Options.
 * @returns String value.
 *
 * @example
 * import { bytesToString } from 'viem'
 * const data = bytesToString(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // 'Hello world'
 */
export function bytesToString(
  bytes_: ByteArray,
  opts: BytesToStringOpts = {},
): string {
  let bytes = bytes_;
  if (typeof opts.size !== 'undefined') {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes, { dir: 'right' });
  }
  return new TextDecoder().decode(bytes);
}
