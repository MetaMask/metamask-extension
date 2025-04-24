import { type ToBytesErrorType, toBytes } from '../encoding/toBytes';

import type { ErrorType } from '../../errors/utils';
import { type Keccak256ErrorType, keccak256 } from './keccak256';

const hash = (value: string) => keccak256(toBytes(value));

export type HashSignatureErrorType =
  | Keccak256ErrorType
  | ToBytesErrorType
  | ErrorType;

export function hashSignature(sig: string) {
  return hash(sig);
}
