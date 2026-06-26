import React, { useMemo } from 'react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { isStellarClassicTrustlineInactiveForDisplay } from '../../../../helpers/stellar/trustline-from-extra';
import type { TokenDisplayOverrides } from '../types';
import { StellarTrustlineInactiveBadge } from '../stellar-trustline-inactive-badge/stellar-trustline-inactive-badge';

/**
 * Hook that determines if a Stellar classic asset should have display overrides
 * (title badge, hidden displays) due to trustline-inactive state.
 *
 * This centralizes all Stellar-specific display logic, allowing generic token
 * cell components to receive simple override props rather than checking for
 * Stellar-specific conditions.
 *
 * Returns undefined if the token is not a Stellar classic asset or is active,
 * meaning no overrides should be applied.
 *
 * @param options - Token context
 * @param options.chainId - CAIP-2 chain ID
 * @param options.assetId - CAIP-19 asset ID
 * @param options.isNative - Whether token is native
 * @param options.accountAssetInfo - Balance enrichment data from MultichainBalancesController
 * @param options.balance - Formatted balance string
 * @returns TokenDisplayOverrides if Stellar classic trustline is inactive, undefined otherwise
 */
export function useStellarAssetDisplayOverrides(options: {
  chainId: CaipChainId | string;
  assetId?: CaipAssetType | string;
  isNative?: boolean;
  accountAssetInfo?: Record<string, unknown>;
  balance?: string;
}): TokenDisplayOverrides | undefined {
  return useMemo(() => {
    const isStellarTrustlineInactive =
      isStellarClassicTrustlineInactiveForDisplay(options);

    if (!isStellarTrustlineInactive) {
      return undefined;
    }

    return {
      titleBadge: <StellarTrustlineInactiveBadge />,
      hidePrimaryDisplay: true,
      hideSecondaryDisplay: true,
      trailingLabel: undefined,
    };
  }, [options]);
}
