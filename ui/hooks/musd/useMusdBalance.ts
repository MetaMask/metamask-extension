/**
 * useMusdBalance Hook
 *
 * Hook for detecting if the current user has mUSD balance.
 * Used to determine visibility of secondary CTAs (token list item CTAs)
 * which only show when user already has mUSD.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdBalance.ts
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  getTokenBalancesEvm,
  getAssetsBySelectedAccountGroup,
} from '../../selectors/assets';
import { getSelectedAccount } from '../../selectors';
import { getIsMultichainAccountsState2Enabled } from '../../selectors/multichain-accounts/feature-flags';
import {
  isMusdToken,
  isMusdSupportedChain,
} from '../../components/app/musd/constants';

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for useMusdBalance hook
 */
export type UseMusdBalanceResult = {
  /** Whether the user has mUSD balance (any amount > 0) */
  hasMusdBalance: boolean;
  /** Total mUSD balance across all chains (raw balance string) */
  totalMusdBalance: string;
  /** mUSD balances by chain */
  musdBalancesByChain: Record<Hex, string>;
  /** Whether the balance is loading */
  isLoading: boolean;
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to detect mUSD balance for the current user
 *
 * @returns Object with mUSD balance information
 */
export function useMusdBalance(): UseMusdBalanceResult {
  const selectedAccount = useSelector(getSelectedAccount);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // Get token balances based on multichain state
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(
      state as Parameters<typeof getTokenBalancesEvm>[0],
      selectedAccount?.address,
    ),
  );
  const accountGroupAssets = useSelector(getAssetsBySelectedAccountGroup);

  // Compute mUSD balances
  const { hasMusdBalance, totalMusdBalance, musdBalancesByChain, isLoading } =
    useMemo(() => {
      let hasBalance = false;
      let total = '0';
      const balancesByChain: Record<Hex, string> = {};
      const loading = false;

      // If no account selected, return empty state
      if (!selectedAccount?.address) {
        return {
          hasMusdBalance: false,
          totalMusdBalance: '0',
          musdBalancesByChain: {},
          isLoading: false,
        };
      }

      if (isMultichainAccountsState2Enabled) {
        // Use new multichain asset structure
        for (const [rawChainId, assets] of Object.entries(accountGroupAssets)) {
          const chainId = rawChainId.toLowerCase() as Hex;
          if (!isMusdSupportedChain(chainId)) {
            continue;
          }

          for (const asset of assets) {
            const address = 'address' in asset ? asset.address : null;
            if (address && isMusdToken(address)) {
              const balance = asset.balance || '0';
              if (balance !== '0') {
                hasBalance = true;
                balancesByChain[chainId] = balance;
                total = new BigNumber(total).plus(balance).toString();
              }
            }
          }
        }
      } else if (evmBalances && Array.isArray(evmBalances)) {
        // Use legacy EVM balances structure
        for (const token of evmBalances) {
          const chainId = (token.chainId as string)?.toLowerCase() as Hex;
          if (
            token.address &&
            isMusdToken(token.address) &&
            chainId &&
            isMusdSupportedChain(chainId)
          ) {
            const balance = token.balance || '0';
            if (balance !== '0') {
              hasBalance = true;
              balancesByChain[chainId] = balance;
              total = new BigNumber(total).plus(balance).toString();
            }
          }
        }
      }

      return {
        hasMusdBalance: hasBalance,
        totalMusdBalance: total,
        musdBalancesByChain: balancesByChain,
        isLoading: loading,
      };
    }, [
      selectedAccount?.address,
      isMultichainAccountsState2Enabled,
      accountGroupAssets,
      evmBalances,
    ]);

  return {
    hasMusdBalance,
    totalMusdBalance,
    musdBalancesByChain,
    isLoading,
  };
}

export default useMusdBalance;
