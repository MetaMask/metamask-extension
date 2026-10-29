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
import { useAppSelector } from '../../store/hooks';

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
  // The active rewards subscription id is populated asynchronously by the
  // controller's silent auth (after keyring unlock / account changes). Keying
  // the query on it ensures the cached cold-start `null` (returned while the
  // subscription state is still unhydrated, before any `/vip/fees` call) is
  // invalidated and the tier is refetched once the subscription becomes
  // available — otherwise the badge stays hidden until a full reset.
  const rewardsSubscriptionId = useAppSelector(
    (state) => state.metamask.rewardsActiveAccount?.subscriptionId ?? null,
  );

  const { data } = useRewardsVipTierQuery(
    isVipProgramEnabled ? accountId : null,
    rewardsSubscriptionId,
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

function useRewardsVipTierQuery(
  accountId: string | null,
  subscriptionId: string | null,
) {
  return useQuery({
    queryKey: ['rewardsVipTier', accountId, subscriptionId],
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
