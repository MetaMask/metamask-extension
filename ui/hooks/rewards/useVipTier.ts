import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../store/background-connection';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { formatAccountToCaipAccountId } from '../../helpers/utils/rewards-utils';

/**
 * Derives the selected account's CAIP-10 ID and fetches its VIP tier from the
 * background's `rewardsGetVipTierForAccount` handler.
 *
 * @returns The numeric VIP tier (`null` while loading, on error, or when the
 * account has no VIP tier).
 */
export function useVipTier(): number | null {
  const accountId = useVipTierAccountId();

  const { data } = useRewardsVipTierQuery(accountId);

  return data ?? null;
}

function useVipTierAccountId() {
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

function useRewardsVipTierQuery(accountId: string | null) {
  return useQuery({
    queryKey: ['rewardsVipTier', accountId],
    queryFn: async () => {
      const tier = await submitRequestToBackground<number | null>(
        'rewardsGetVipTierForAccount',
        [String(accountId)],
      );
      return tier ?? null;
    },
    enabled: accountId !== null,
  });
}
