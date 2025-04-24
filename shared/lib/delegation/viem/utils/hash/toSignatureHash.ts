import type { AbiEvent, AbiFunction } from 'abitype';

import type { ErrorType } from '../../errors/utils';
import { type HashSignatureErrorType, hashSignature } from './hashSignature';
import { type ToSignatureErrorType, toSignature } from './toSignature';

export type ToSignatureHashErrorType =
  | HashSignatureErrorType
  | ToSignatureErrorType
  | ErrorType;

export function toSignatureHash(fn: string | AbiFunction | AbiEvent) {
  return hashSignature(toSignature(fn));
}
