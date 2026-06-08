import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../store/background-connection';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { formatAccountToCaipAccountId } from '../../helpers/utils/rewards-utils';
import { selectVipProgramEnabled } from '../../ducks/rewards/selectors';

/**
 * Derives the selected account's CAIP-10 ID and fetches its VIP tier from the
 * background's `rewardsGetVipTierForAccount` handler.
 *
 * Gated by the `vipProgramEnabled` remote feature flag — returns `null`
 * immediately and skips the background lookup when the flag is off.
 *
 * @returns The numeric VIP tier (`null` while loading, on error, when the
 * VIP program is disabled, or when the account has no VIP tier).
 */
export function useVipTier(): number | null {
  const isVipProgramEnabled = useSelector(selectVipProgramEnabled);
  const accountId = useVipTierAccountId();

  const { data } = useRewardsVipTierQuery(
    isVipProgramEnabled ? accountId : null,
  );

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
