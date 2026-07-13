import { AccountWalletType } from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';

import type { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';

/**
 * Whether a wallet can be synced to MetaMask Mobile via QR sync.
 * @param wallet
 */
export function isSyncableWallet(wallet: AccountWalletObject): boolean {
  if (wallet.type === AccountWalletType.Entropy) {
    return true;
  }

  if (wallet.type !== AccountWalletType.Keyring) {
    return false;
  }

  const keyringType = wallet.metadata.keyring.type;

  return keyringType === KeyringTypes.hd || keyringType === KeyringTypes.simple;
}

/**
 * Returns only wallets that can be synced (HD/SRP and imported private-key wallets).
 * @param wallets
 */
export function filterSyncableWallets(
  wallets: AccountTreeWallets,
): AccountTreeWallets {
  return Object.fromEntries(
    Object.entries(wallets).filter(([, wallet]) => isSyncableWallet(wallet)),
  ) as AccountTreeWallets;
}
