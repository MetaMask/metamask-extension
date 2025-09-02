import { AccountWalletId } from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';

/**
 * Filter wallets based on a search pattern, returning only wallets that have groups
 * with account names matching the search pattern.
 *
 * @param wallets - The wallets collection to filter.
 * @param searchPattern - The search pattern to match group names against.
 * @returns Filtered wallets containing only groups that match the search pattern.
 */
export function filterWalletsByGroupName(
  wallets: AccountTreeWallets,
  searchPattern: string,
): AccountTreeWallets {
  if (!searchPattern.trim()) {
    return wallets;
  }

  const normalizedSearchPattern = searchPattern.trim().toLowerCase();
  const result: AccountTreeWallets = {};

  Object.entries(wallets).forEach(([walletId, wallet]) => {
    const hasMatchingGroup = Object.values(wallet.groups || {}).some(
      (group) => {
        const groupName = group.metadata?.name;
        return groupName?.toLowerCase().includes(normalizedSearchPattern);
      },
    );

    if (hasMatchingGroup) {
      // Recreate a new wallet with filtered groups
      result[walletId as AccountWalletId] = {
        ...wallet,
        groups: Object.fromEntries(
          Object.entries(wallet.groups || {}).filter(([_, group]) => {
            const groupName = group.metadata?.name;
            return groupName?.toLowerCase().includes(normalizedSearchPattern);
          }),
        ),
      };
    }
  });

  return result;
}
