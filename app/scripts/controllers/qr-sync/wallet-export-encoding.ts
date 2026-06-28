import { bytesToBase64, stringToBytes } from '@metamask/utils';

import { convertEnglishWordlistIndicesToCodepoints } from '../../lib/util';

/**
 * Encodes a BIP-39 mnemonic for the sync-ready payload.
 *
 * Flow: wordlist indices → UTF-8 space-separated words → base64.
 */
export function encodeMnemonicForWalletExport(
  wordlistIndices: Uint8Array,
): string {
  const mnemonicUtf8 = convertEnglishWordlistIndicesToCodepoints(wordlistIndices);
  return bytesToBase64(mnemonicUtf8);
}

/**
 * Encodes a hex private key string for the sync-ready payload.
 *
 * Flow: UTF-8 string (e.g. `0xabc…`) → base64.
 */
export function encodePrivateKeyForWalletExport(privateKeyHex: string): string {
  return bytesToBase64(stringToBytes(privateKeyHex));
}
