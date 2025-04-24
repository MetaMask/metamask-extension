import {
  SliceOffsetOutOfBoundsError,
  type SliceOffsetOutOfBoundsErrorType,
} from '../../errors/data';
import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';

import { type IsHexErrorType, isHex } from './isHex';
import { type SizeErrorType, size } from './size';

export type SliceReturnType<value extends ByteArray | Hex> = value extends Hex
  ? Hex
  : ByteArray;

export type SliceErrorType =
  | IsHexErrorType
  | SliceBytesErrorType
  | SliceHexErrorType
  | ErrorType;

/**
 * @description Returns a section of the hex or byte array given a start/end bytes offset.
 *
 * @param value The hex or byte array to slice.
 * @param start The start offset (in bytes).
 * @param end The end offset (in bytes).
 */
export function slice<value extends ByteArray | Hex>(
  value: value,
  start?: number | undefined,
  end?: number | undefined,
  { strict }: { strict?: boolean | undefined } = {},
): SliceReturnType<value> {
  if (isHex(value, { strict: false }))
    return sliceHex(value as Hex, start, end, {
      strict,
    }) as SliceReturnType<value>;
  return sliceBytes(value as ByteArray, start, end, {
    strict,
  }) as SliceReturnType<value>;
}

export type AssertStartOffsetErrorType =
  | SliceOffsetOutOfBoundsErrorType
  | SizeErrorType
  | ErrorType;

function assertStartOffset(value: Hex | ByteArray, start?: number | undefined) {
  if (typeof start === 'number' && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: 'start',
      size: size(value),
    });
}

export type AssertEndOffsetErrorType =
  | SliceOffsetOutOfBoundsErrorType
  | SizeErrorType
  | ErrorType;

function assertEndOffset(
  value: Hex | ByteArray,
  start?: number | undefined,
  end?: number | undefined,
) {
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    size(value) !== end - start
  ) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: 'end',
      size: size(value),
    });
  }
}

export type SliceBytesErrorType =
  | AssertStartOffsetErrorType
  | AssertEndOffsetErrorType
  | ErrorType;

/**
 * @description Returns a section of the byte array given a start/end bytes offset.
 *
 * @param value The byte array to slice.
 * @param start The start offset (in bytes).
 * @param end The end offset (in bytes).
 */
export function sliceBytes(
  value_: ByteArray,
  start?: number | undefined,
  end?: number | undefined,
  { strict }: { strict?: boolean | undefined } = {},
): ByteArray {
  assertStartOffset(value_, start);
  const value = value_.slice(start, end);
  if (strict) assertEndOffset(value, start, end);
  return value;
}

export type SliceHexErrorType =
  | AssertStartOffsetErrorType
  | AssertEndOffsetErrorType
  | ErrorType;

/**
 * @description Returns a section of the hex value given a start/end bytes offset.
 *
 * @param value The hex value to slice.
 * @param start The start offset (in bytes).
 * @param end The end offset (in bytes).
 */
export function sliceHex(
  value_: Hex,
  start?: number | undefined,
  end?: number | undefined,
  { strict }: { strict?: boolean | undefined } = {},
): Hex {
  assertStartOffset(value_, start);
  const value = `0x${value_
    .replace('0x', '')
    .slice((start ?? 0) * 2, (end ?? value_.length) * 2)}` as const;
  if (strict) assertEndOffset(value, start, end);
  return value;
}
