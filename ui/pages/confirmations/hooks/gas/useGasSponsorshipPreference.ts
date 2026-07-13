import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { setGasSponsorshipOptOut } from '../../../../store/actions';

/**
 * Hook to read and write the per-chain gas sponsorship opt-out preference.
 *
 * When a user opts out of gas sponsorship on a given chain, their preference
 * is persisted so future transactions on the same chain default to paying
 * with the native token instead of using sponsorship.
 *
 * @param chainId - The chain ID to check the preference for.
 * @returns An object containing:
 * - `isSponsorshipOptedOut`: Whether the user has opted out of gas sponsorship for this chain.
 * - `setSponsorshipOptedOut`: Function to set the opt-out preference for this chain.
 */
export function useGasSponsorshipPreference(chainId: Hex | undefined) {
  const dispatch = useDispatch();
  const { gasSponsorshipOptOutByChainId } = useSelector(getPreferences);

  const isSponsorshipOptedOut = Boolean(
    chainId && gasSponsorshipOptOutByChainId?.[chainId],
  );

  const setSponsorshipOptedOut = useCallback(
    (optOut: boolean) => {
      if (!chainId) {
        return;
      }

      dispatch(
        setGasSponsorshipOptOut({
          ...gasSponsorshipOptOutByChainId,
          [chainId]: optOut,
        }),
      );
    },
    [chainId, dispatch, gasSponsorshipOptOutByChainId],
  );

  return { isSponsorshipOptedOut, setSponsorshipOptedOut };
}
