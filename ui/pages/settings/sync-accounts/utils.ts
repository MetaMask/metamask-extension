import { AccountWalletType, type AccountGroupId } from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';

import type { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { extractWalletIdFromGroupId } from '../../../selectors/multichain-accounts/utils';
import type { AddDeviceSyncRequest } from './types';

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

/**
 * Derives success-screen counts from the selected account groups.
 * Entropy and HD keyring wallets contribute to `syncedWalletCount`; imported
 * private-key account groups contribute to `syncedAccountCount`.
 *
 * @param wallets - Syncable wallets shown in the wallet picker.
 * @param selectedAccountGroupIds - Selected account group IDs.
 */
export function getSyncSummaryCounts(
  wallets: AccountTreeWallets,
  selectedAccountGroupIds: AccountGroupId[],
): Pick<AddDeviceSyncRequest, 'syncedAccountCount' | 'syncedWalletCount'> {
  const selectedWalletIds = [
    ...new Set(
      selectedAccountGroupIds.map((accountGroupId) =>
        extractWalletIdFromGroupId(accountGroupId),
      ),
    ),
  ];

  let syncedWalletCount = 0;
  let syncedAccountCount = 0;

  for (const walletId of selectedWalletIds) {
    const wallet = wallets[walletId];
    if (!wallet) {
      continue;
    }

    const selectedGroupCount = selectedAccountGroupIds.filter(
      (accountGroupId) =>
        extractWalletIdFromGroupId(accountGroupId) === walletId,
    ).length;

    if (selectedGroupCount === 0) {
      continue;
    }

    if (wallet.type === AccountWalletType.Entropy) {
      syncedWalletCount += 1;
      continue;
    }

    if (wallet.type === AccountWalletType.Keyring) {
      const keyringType = wallet.metadata.keyring.type;

      if (keyringType === KeyringTypes.hd) {
        syncedWalletCount += 1;
      } else if (keyringType === KeyringTypes.simple) {
        syncedAccountCount += selectedGroupCount;
      }
    }
  }

  return { syncedWalletCount, syncedAccountCount };
}
