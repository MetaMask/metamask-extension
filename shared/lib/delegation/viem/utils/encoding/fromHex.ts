/* eslint-disable no-bitwise */
import {
  InvalidHexBooleanError,
  type InvalidHexBooleanErrorType,
  SizeOverflowError,
  type SizeOverflowErrorType,
} from '../../errors/encoding';
import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';
import { type SizeErrorType, size as size_ } from '../data/size';
import { type TrimErrorType, trim } from '../data/trim';

import { type HexToBytesErrorType, hexToBytes } from './toBytes';

export type AssertSizeErrorType =
  | SizeOverflowErrorType
  | SizeErrorType
  | ErrorType;

export function assertSize(
  hexOrBytes: Hex | ByteArray,
  { size }: { size: number },
): void {
  if (size_(hexOrBytes) > size) {
    throw new SizeOverflowError({
      givenSize: size_(hexOrBytes),
      maxSize: size,
    });
  }
}

export type FromHexParameters<
  to extends 'string' | 'bigint' | 'number' | 'bytes' | 'boolean',
> =
  | to
  | {
      /** Size (in bytes) of the hex value. */
      size?: number | undefined;
      /** Type to convert to. */
      to: to;
    };

export type FromHexReturnType<to> = to extends 'string'
  ? string
  : to extends 'bigint'
  ? bigint
  : to extends 'number'
  ? number
  : to extends 'bytes'
  ? ByteArray
  : to extends 'boolean'
  ? boolean
  : never;

export type FromHexErrorType =
  | HexToNumberErrorType
  | HexToBigIntErrorType
  | HexToBoolErrorType
  | HexToStringErrorType
  | HexToBytesErrorType
  | ErrorType;

/**
 * Decodes a hex string into a string, number, bigint, boolean, or byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex
 * - Example: https://viem.sh/docs/utilities/fromHex#usage
 *
 * @param hex - Hex string to decode.
 * @param toOrOpts - Type to convert to or options.
 * @returns Decoded value.
 * @example
 * import { fromHex } from 'viem'
 * const data = fromHex('0x1a4', 'number')
 * // 420
 * @example
 * import { fromHex } from 'viem'
 * const data = fromHex('0x48656c6c6f20576f726c6421', 'string')
 * // 'Hello world'
 * @example
 * import { fromHex } from 'viem'
 * const data = fromHex('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *   size: 32,
 *   to: 'string'
 * })
 * // 'Hello world'
 */
export function fromHex<
  to extends 'string' | 'bigint' | 'number' | 'bytes' | 'boolean',
>(hex: Hex, toOrOpts: FromHexParameters<to>): FromHexReturnType<to> {
  const opts = typeof toOrOpts === 'string' ? { to: toOrOpts } : toOrOpts;
  const { to } = opts;

  if (to === 'number') {
    return hexToNumber(hex, opts) as FromHexReturnType<to>;
  }
  if (to === 'bigint') {
    return hexToBigInt(hex, opts) as FromHexReturnType<to>;
  }
  if (to === 'string') {
    return hexToString(hex, opts) as FromHexReturnType<to>;
  }
  if (to === 'boolean') {
    return hexToBool(hex, opts) as FromHexReturnType<to>;
  }
  return hexToBytes(hex, opts) as FromHexReturnType<to>;
}

export type HexToBigIntOpts = {
  /** Whether or not the number of a signed representation. */
  signed?: boolean | undefined;
  /** Size (in bytes) of the hex value. */
  size?: number | undefined;
};

export type HexToBigIntErrorType = AssertSizeErrorType | ErrorType;

/**
 * Decodes a hex value into a bigint.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex#hextobigint
 *
 * @param hex - Hex value to decode.
 * @param opts - Options.
 * @returns BigInt value.
 * @example
 * import { hexToBigInt } from 'viem'
 * const data = hexToBigInt('0x1a4', { signed: true })
 * // 420n
 * @example
 * import { hexToBigInt } from 'viem'
 * const data = hexToBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420n
 */
export function hexToBigInt(hex: Hex, opts: HexToBigIntOpts = {}): bigint {
  const { signed } = opts;

  if (opts.size) {
    assertSize(hex, { size: opts.size });
  }

  const value = BigInt(hex);
  if (!signed) {
    return value;
  }

  const size = (hex.length - 2) / 2;
  const max = (1n << (BigInt(size) * 8n - 1n)) - 1n;
  if (value <= max) {
    return value;
  }

  return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n;
}

export type HexToBoolOpts = {
  /** Size (in bytes) of the hex value. */
  size?: number | undefined;
};

export type HexToBoolErrorType =
  | AssertSizeErrorType
  | InvalidHexBooleanErrorType
  | TrimErrorType
  | ErrorType;

/**
 * Decodes a hex value into a boolean.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex#hextobool
 *
 * @param hex_ - Hex value to decode.
 * @param opts - Options.
 * @returns Boolean value.
 * @example
 * import { hexToBool } from 'viem'
 * const data = hexToBool('0x01')
 * // true
 * @example
 * import { hexToBool } from 'viem'
 * const data = hexToBool('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // true
 */
export function hexToBool(hex_: Hex, opts: HexToBoolOpts = {}): boolean {
  let hex = hex_;
  if (opts.size) {
    assertSize(hex, { size: opts.size });
    hex = trim(hex);
  }
  if (trim(hex) === '0x00') {
    return false;
  }
  if (trim(hex) === '0x01') {
    return true;
  }
  throw new InvalidHexBooleanError(hex);
}

export type HexToNumberOpts = HexToBigIntOpts;

export type HexToNumberErrorType = HexToBigIntErrorType | ErrorType;

/**
 * Decodes a hex string into a number.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex#hextonumber
 *
 * @param hex - Hex value to decode.
 * @param opts - Options.
 * @returns Number value.
 * @example
 * import { hexToNumber } from 'viem'
 * const data = hexToNumber('0x1a4')
 * // 420
 * @example
 * import { hexToNumber } from 'viem'
 * const data = hexToBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420
 */
export function hexToNumber(hex: Hex, opts: HexToNumberOpts = {}): number {
  return Number(hexToBigInt(hex, opts));
}

export type HexToStringOpts = {
  /** Size (in bytes) of the hex value. */
  size?: number | undefined;
};

export type HexToStringErrorType =
  | AssertSizeErrorType
  | HexToBytesErrorType
  | TrimErrorType
  | ErrorType;

/**
 * Decodes a hex value into a UTF-8 string.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex#hextostring
 *
 * @param hex - Hex value to decode.
 * @param opts - Options.
 * @returns String value.
 * @example
 * import { hexToString } from 'viem'
 * const data = hexToString('0x48656c6c6f20576f726c6421')
 * // 'Hello world!'
 * @example
 * import { hexToString } from 'viem'
 * const data = hexToString('0x48656c6c6f20576f726c64210000000000000000000000000000000000000000', {
 *  size: 32,
 * })
 * // 'Hello world'
 */
export function hexToString(hex: Hex, opts: HexToStringOpts = {}): string {
  let bytes = hexToBytes(hex);
  if (opts.size) {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes, { dir: 'right' });
  }
  return new TextDecoder().decode(bytes);
}
