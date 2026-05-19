import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CaipAccountId } from '@metamask/utils';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { formatAccountToCaipAccountId } from '../../helpers/utils/rewards-utils';

/**
 * Derives a CAIP-10 account ID for the currently selected account and chain,
 * suitable for passing to {@link useVipTier} or {@link RewardsVipBadge}.
 *
 * @returns The CAIP-10 account ID, or `null` when the selected account or
 * chain ID is unavailable or the formatting fails.
 */
export function useVipTierAccountId(): CaipAccountId | null {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);

  return useMemo(
    () =>
      selectedAccount?.address
        ? formatAccountToCaipAccountId(selectedAccount.address, chainId)
        : null,
    [selectedAccount?.address, chainId],
  );
}
