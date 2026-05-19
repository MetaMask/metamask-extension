import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../store/background-connection';
import { forceUpdateMetamaskState } from '../../store/actions';
import type { MetaMaskReduxDispatch } from '../../store/store';
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
  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);

  const accountId = useMemo(
    () =>
      selectedAccount?.address
        ? formatAccountToCaipAccountId(selectedAccount.address, chainId)
        : null,
    [selectedAccount?.address, chainId],
  );

  const [vipTier, setVipTier] = useState<number | null>(null);

  useEffect(() => {
    if (!accountId) {
      setVipTier(null);
      return;
    }

    dispatch(async (d: MetaMaskReduxDispatch) => {
      try {
        const vipTierResponse = await submitRequestToBackground<number | null>(
          'rewardsGetVipTierForAccount',
          [accountId],
        );
        await forceUpdateMetamaskState(d);
        setVipTier(vipTierResponse);
      } catch (error) {
        console.warn('Error fetching vip tier:', error);
        setVipTier(null);
      }
    });
  }, [accountId, dispatch]);

  return vipTier;
}
