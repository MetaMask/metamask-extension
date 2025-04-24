/* eslint-disable camelcase */
import { keccak_256 } from '@noble/hashes/sha3';

import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';
import { type IsHexErrorType, isHex } from '../data/isHex';
import { type ToBytesErrorType, toBytes } from '../encoding/toBytes';
import { type ToHexErrorType, toHex } from '../encoding/toHex';

type To = 'hex' | 'bytes';

export type Keccak256Hash<to extends To> =
  | (to extends 'bytes' ? ByteArray : never)
  | (to extends 'hex' ? Hex : never);

export type Keccak256ErrorType =
  | IsHexErrorType
  | ToBytesErrorType
  | ToHexErrorType
  | ErrorType;

export function keccak256<to extends To = 'hex'>(
  value: Hex | ByteArray,
  to_?: to | undefined,
): Keccak256Hash<to> {
  const to = to_ || 'hex';
  const bytes = keccak_256(
    isHex(value, { strict: false }) ? toBytes(value) : value,
  );
  if (to === 'bytes') {
    return bytes as Keccak256Hash<to>;
  }
  return toHex(bytes) as Keccak256Hash<to>;
}
