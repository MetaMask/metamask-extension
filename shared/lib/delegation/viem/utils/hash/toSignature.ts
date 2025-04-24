import { type AbiEvent, type AbiFunction, formatAbiItem } from 'abitype';

import type { ErrorType } from '../../errors/utils';
import {
  type NormalizeSignatureErrorType,
  normalizeSignature,
} from './normalizeSignature';

export type ToSignatureErrorType = NormalizeSignatureErrorType | ErrorType;

/**
 * Returns the signature for a given function or event definition.
 *
 * @param def
 * @example
 * const signature = toSignature('function ownerOf(uint256 tokenId)')
 * // 'ownerOf(uint256)'
 * @example
 * const signature_3 = toSignature({
 *   name: 'ownerOf',
 *   type: 'function',
 *   inputs: [{ name: 'tokenId', type: 'uint256' }],
 *   outputs: [],
 *   stateMutability: 'view',
 * })
 * // 'ownerOf(uint256)'
 */
export const toSignature = (def: string | AbiFunction | AbiEvent) => {
  const def_ = (() => {
    if (typeof def === 'string') {
      return def;
    }
    return formatAbiItem(def);
  })();
  return normalizeSignature(def_);
};
