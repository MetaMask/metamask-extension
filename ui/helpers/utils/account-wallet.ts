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
