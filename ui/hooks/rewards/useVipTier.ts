import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  parseCaipChainId,
  toCaipAccountId,
  type CaipAccountId,
} from '@metamask/utils';
import log from 'loglevel';
import { submitRequestToBackground } from '../../store/background-connection';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
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
  return useMemo<CaipAccountId | null>(() => {
    const [scope] = selectedAccount?.scopes ?? [];
    if (!selectedAccount?.address || !scope) {
      return null;
    }
    try {
      const { namespace, reference } = parseCaipChainId(scope);
      return toCaipAccountId(namespace, reference, selectedAccount.address);
    } catch (error) {
      log.error('[useVipTier] Error formatting account to CAIP-10:', error);
      return null;
    }
  }, [selectedAccount?.address, selectedAccount?.scopes]);
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
