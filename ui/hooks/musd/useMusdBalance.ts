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
import { getAssetsBySelectedAccountGroup } from '../../selectors/assets';
import { getSelectedAccount } from '../../selectors';
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

      return {
        hasMusdBalance: hasBalance,
        totalMusdBalance: total,
        musdBalancesByChain: balancesByChain,
        isLoading: loading,
      };
    }, [selectedAccount?.address, accountGroupAssets]);

  return {
    hasMusdBalance,
    totalMusdBalance,
    musdBalancesByChain,
    isLoading,
  };
}

export default useMusdBalance;
