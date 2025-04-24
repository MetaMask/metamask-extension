import type { AbiFunction } from 'abitype';

import type { ErrorType } from '../../errors/utils';
import { type SliceErrorType, slice } from '../data/slice';
import {
  type ToSignatureHashErrorType,
  toSignatureHash,
} from './toSignatureHash';

export type ToFunctionSelectorErrorType =
  | ToSignatureHashErrorType
  | SliceErrorType
  | ErrorType;

export const toFunctionSelector = (fn: string | AbiFunction) =>
  slice(toSignatureHash(fn), 0, 4);
