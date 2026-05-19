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
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);

  const accountId = useMemo(
    () =>
      selectedAccount?.address
        ? formatAccountToCaipAccountId(selectedAccount.address, chainId)
        : null,
    [selectedAccount?.address, chainId],
  );

  const { data } = useQuery({
    queryKey: ['rewardsVipTier', accountId],
    queryFn: () =>
      submitRequestToBackground<number | null>(
        'rewardsGetVipTierForAccount',
        [accountId as NonNullable<typeof accountId>],
      ),
    enabled: accountId !== null,
  });

  return data ?? null;
}
