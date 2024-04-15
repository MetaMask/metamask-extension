import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export function createSHA256Hash(data: string): string {
  const hashedData = sha256(data);
  return bytesToHex(hashedData);
}
