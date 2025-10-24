import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import {
  AccountTreeWallets,
  NormalizedGroupMetadata,
} from '../../../selectors/multichain-accounts/account-tree.types';

/**
 * Filter wallets based on a search pattern, returning only wallets that have groups
 * with account names matching the search pattern.
 *
 * @param wallets - The wallets collection to filter.
 * @param searchPattern - The search pattern to match group names against.
 * @param groupsMetadata - The groups metadata.
 * @returns Filtered wallets containing only groups that match the search pattern.
 */
export function filterWalletsByGroupNameOrAddress(
  wallets: AccountTreeWallets,
  searchPattern: string,
  groupsMetadata: Record<AccountGroupId, NormalizedGroupMetadata>,
): AccountTreeWallets {
  const normalizedSearchPattern = searchPattern.trim().toLowerCase();

  if (!normalizedSearchPattern) {
    return wallets;
  }

  return Object.entries(wallets).reduce<AccountTreeWallets>(
    (result, [walletId, wallet]) => {
      let hasGroups = false;
      const filteredGroups = Object.entries(wallet.groups || {}).reduce<
        Record<AccountGroupId, AccountGroupObject>
      >((groupsResult, [groupId, group]) => {
        const metadata = groupsMetadata[groupId as AccountGroupId];
        const matchesName = metadata?.name.includes(normalizedSearchPattern);
        const matchesAddress = metadata?.accounts.some((account: string) =>
          account.includes(normalizedSearchPattern),
        );
        if (matchesName || matchesAddress) {
          groupsResult[groupId as AccountGroupId] = group;
          hasGroups = true;
        }
        return groupsResult;
      }, {});

      // Only include the wallet if it has any matching groups
      if (hasGroups) {
        result[walletId as AccountWalletId] = {
          ...wallet,
          groups: filteredGroups as unknown as AccountGroupObject,
        };
      }

      return result;
    },
    {},
  );
}
