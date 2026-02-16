/**
 * Custom hook for account count data
 * Feature: account-count-display
 *
 * This hook provides the total account count and wallet breakdown
 * by consuming existing Redux selectors from the account tree.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getWalletsWithAccounts,
  getAccountListStats,
} from '../selectors/multichain-accounts/account-tree';
import type {
  AccountCountData,
  WalletBreakdown,
} from '../components/app/account-count-display/account-count-display.types';

/**
 * Hook to get account count data for display
 *
 * Uses real MetaMask Redux selectors:
 * - getAccountListStats: total account groups count, hidden count, pinned count
 * - getWalletsWithAccounts: wallet-level breakdown with account details
 *
 * @returns AccountCountData with totalCount, breakdown, hiddenCount, and isLoading
 *
 * @example
 * ```tsx
 * const { totalCount, breakdown, hiddenCount, isLoading } = useAccountCount();
 * ```
 */
export function useAccountCount(): AccountCountData {
  const accountListStats = useSelector(getAccountListStats);
  const walletsWithAccounts = useSelector(getWalletsWithAccounts);

  const breakdown: WalletBreakdown[] = useMemo(() => {
    if (!walletsWithAccounts) {
      return [];
    }

    return Object.values(walletsWithAccounts).map((wallet) => {
      // Count groups in this wallet — each group is one user-visible account
      // (groups contain multichain sub-accounts like EVM + Solana, which we don't count separately)
      const accountCount = Object.keys(wallet.groups).length;

      return {
        id: wallet.id,
        name: wallet.metadata?.name ?? wallet.id,
        accountCount,
      };
    });
  }, [walletsWithAccounts]);

  return {
    totalCount: accountListStats?.totalAccounts ?? 0,
    breakdown,
    hiddenCount: accountListStats?.hiddenCount ?? 0,
    isLoading: false,
  };
}

export default useAccountCount;
