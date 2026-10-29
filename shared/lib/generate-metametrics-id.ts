import { bytesToHex } from '@metamask/utils';
import { keccak256 } from 'ethereum-cryptography/keccak';

/**
 * Generate a new MetaMetrics / analytics client id (keccak256 hash of entropy).
 */
export function generateMetaMetricsId(): string {
  return bytesToHex(
    keccak256(
      Buffer.from(
        String(Date.now()) +
          String(Math.round(Math.random() * Number.MAX_SAFE_INTEGER)),
      ),
    ),
  );
}
