import { isStrictHexString } from '@metamask/utils';

export function isValidTransactionHash(hash: string): boolean {
  // Check if it's exactly 66 characters (0x + 64 hex chars)
  return hash.length === 66 && isStrictHexString(hash);
}
