import {
  SizeExceedsPaddingSizeError,
  type SizeExceedsPaddingSizeErrorType,
} from '../../errors/data';
import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';

type PadOptions = {
  dir?: 'left' | 'right' | undefined;
  size?: number | null | undefined;
};
export type PadReturnType<value extends ByteArray | Hex> = value extends Hex
  ? Hex
  : ByteArray;

export type PadErrorType = PadHexErrorType | PadBytesErrorType | ErrorType;

export function pad<value extends ByteArray | Hex>(
  hexOrBytes: value,
  { dir, size = 32 }: PadOptions = {},
): PadReturnType<value> {
  if (typeof hexOrBytes === 'string') {
    return padHex(hexOrBytes, { dir, size }) as PadReturnType<value>;
  }
  return padBytes(hexOrBytes, { dir, size }) as PadReturnType<value>;
}

export type PadHexErrorType = SizeExceedsPaddingSizeErrorType | ErrorType;

export function padHex(hex_: Hex, { dir, size = 32 }: PadOptions = {}) {
  if (size === null) {
    return hex_;
  }
  const hex = hex_.replace('0x', '');
  if (hex.length > size * 2) {
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size,
      type: 'hex',
    });
  }

  return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](
    size * 2,
    '0',
  )}` as Hex;
}

export type PadBytesErrorType = SizeExceedsPaddingSizeErrorType | ErrorType;

export function padBytes(
  bytes: ByteArray,
  { dir, size = 32 }: PadOptions = {},
) {
  if (size === null) {
    return bytes;
  }
  if (bytes.length > size) {
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size,
      type: 'bytes',
    });
  }
  const paddedBytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const padEnd = dir === 'right';
    paddedBytes[padEnd ? i : size - i - 1] =
      bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
