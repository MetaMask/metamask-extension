import { AccountWalletType } from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';

/**
 * Imported private-key wallets hold a single account that the user can delete
 * and restore at will, so they are managed differently from every other wallet.
 *
 * @param wallet - Wallet object from the account tree.
 * @returns True when the wallet is a simple (imported private key) keyring.
 */
export function isPrivateKeyWallet(wallet: AccountWalletObject): boolean {
  return (
    wallet.type === AccountWalletType.Keyring &&
    wallet.metadata.keyring.type === KeyringTypes.simple
  );
}

/**
 * The primary wallet is the entropy wallet derived from the first HD keyring.
 *
 * @param wallet - Wallet object from the account tree.
 * @param primaryHdKeyringId - Metadata id of the first HD keyring, if any.
 * @returns True when this wallet is the primary HD wallet.
 */
export function isPrimaryWallet(
  wallet: AccountWalletObject,
  primaryHdKeyringId: string | undefined,
): boolean {
  return (
    Boolean(primaryHdKeyringId) &&
    wallet.type === AccountWalletType.Entropy &&
    wallet.metadata.entropy.id === primaryHdKeyringId
  );
}
