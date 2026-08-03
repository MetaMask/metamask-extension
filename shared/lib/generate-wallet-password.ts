import { bytesToBase64 } from '@metamask/utils';

const DEFAULT_PASSWORD_BYTE_LENGTH = 32;

/**
 * Generates a high-entropy wallet password for passkey-only social onboarding.
 *
 * The user never sees this value; it encrypts the vault / TOPRF backup and is
 * recovered later via secret-escrow passkey unlock.
 *
 * @param byteLength - Number of random bytes (default 32).
 * @returns Unpadded base64url password string.
 */
export function generateWalletPassword(
  byteLength: number = DEFAULT_PASSWORD_BYTE_LENGTH,
): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToBase64(bytes)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/[=]+$/u, '');
}
