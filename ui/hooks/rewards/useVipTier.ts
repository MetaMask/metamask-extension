import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { CaipAccountId } from '@metamask/utils';
import { submitRequestToBackground } from '../../store/background-connection';
import { forceUpdateMetamaskState } from '../../store/actions';
import type { MetaMaskReduxDispatch } from '../../store/store';

/**
 * Fetches the VIP tier for the given CAIP-10 account from the background's
 * `rewardsGetVipTierForAccount` handler.
 *
 * @param accountId - CAIP-10 account identifier to look up.
 * @returns The numeric VIP tier (`null` while loading, on error, or when the
 * account has no VIP tier).
 */
export function useVipTier(accountId: CaipAccountId): number | null {
  const dispatch = useDispatch();
  const [vipTier, setVipTier] = useState<number | null>(null);

  useEffect(() => {
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
