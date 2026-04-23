import { bytesToHex, stringToBytes, type Hex } from '@metamask/utils';
import { keccak256 } from 'ethereum-cryptography/keccak';

/**
 * Derives a deterministic campaign identifier from a campaign name.
 *
 * @param name - Campaign display name.
 * @returns Keccak256 hash of UTF-8 campaign name bytes.
 */
export function deriveCampaignId(name: string): Hex {
  return bytesToHex(keccak256(stringToBytes(name)));
}
