import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';
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

  return Object.entries(wallets).reduce((result, [walletId, wallet]) => {
    const filteredGroups = Object.entries(wallet.groups || {}).reduce(
      (groupsResult: Record<string, AccountGroupId>, [groupId, group]) => {
        const groupName = group.metadata?.name;
        if (groupName?.toLowerCase().includes(normalizedSearchPattern)) {
          groupsResult[groupId] = group;
        }
        return groupsResult;
      },
      {} as Record<string, AccountGroupId>,
    );

    // Only include the wallet if it has any matching groups
    if (Object.keys(filteredGroups).length > 0) {
      result[walletId as AccountWalletId] = {
        ...wallet,
        groups: filteredGroups as unknown as AccountGroupObject,
      };
    }

    return result;
  }, {} as AccountTreeWallets);
}
