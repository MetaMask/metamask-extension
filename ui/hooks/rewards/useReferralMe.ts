import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';
import {
  resetRewardsMoneyReferralMe,
  setRewardsMoneyReferralMe,
  setRewardsMoneyReferralMeSettled,
} from '../../ducks/rewards-money';
import {
  selectReferralMe,
  selectReferralMeSettled,
} from '../../ducks/rewards-money/selectors';
import { getRewardsMoneyReferralMe } from '../../store/actions';
import { useDispatch } from '../../store/hooks';

export const MAX_REFERRAL_ME_REFRESH_ATTEMPTS = 3;

export type FetchReferralMeResult = {
  status: 'settled' | 'discarded';
};

type UseReferralMeOptions = {
  fetchOnMount?: boolean;
};

type UseReferralMeResult = {
  referralMe: ReferralMeDto | null;
  isSettled: boolean;
  fetchReferralMe: (options?: {
    forceFresh?: boolean;
  }) => Promise<FetchReferralMeResult>;
};

/**
 * The controller copies `sessionChanged` onto `error.data` so the UI can
 * detect it after the background RPC boundary.
 *
 * @param error - The thrown referral-me error.
 * @returns Whether the read should be discarded and retried.
 */
function isRewardsMoneySessionChangedError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return false;
  }
  const data = (error as { data?: { sessionChanged?: boolean } }).data;
  return data?.sessionChanged === true;
}

/**
 * Loads referral me for the invite sheet and stores the payload on the
 * rewards-money slice. A superseded or session-changed read is discarded.
 *
 * @param options - Pass `fetchOnMount: false` when this instance should not
 * start a read. The invite sheet is the only instance and fetches on mount.
 * @param options.fetchOnMount - Whether to fetch when the hook mounts.
 * @returns The latest payload and a fetch function.
 */
export function useReferralMe({
  fetchOnMount = true,
}: UseReferralMeOptions = {}): UseReferralMeResult {
  const dispatch = useDispatch();
  const referralMe = useSelector(selectReferralMe);
  const isSettled = useSelector(selectReferralMeSettled);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchReferralMe = useCallback(
    async (
      options: { forceFresh?: boolean } = {},
    ): Promise<FetchReferralMeResult> => {
      const generation = generationRef.current + 1;
      generationRef.current = generation;

      try {
        const data = (await dispatch(
          getRewardsMoneyReferralMe({ forceFresh: options.forceFresh }),
        )) as ReferralMeDto;
        if (!mountedRef.current || generation !== generationRef.current) {
          return { status: 'discarded' };
        }
        dispatch(setRewardsMoneyReferralMe(data));
        return { status: 'settled' };
      } catch (error) {
        if (!mountedRef.current || generation !== generationRef.current) {
          return { status: 'discarded' };
        }
        if (isRewardsMoneySessionChangedError(error)) {
          return { status: 'discarded' };
        }
        dispatch(setRewardsMoneyReferralMeSettled(true));
        return { status: 'settled' };
      }
    },
    [dispatch],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (fetchOnMount) {
      void fetchReferralMe();
    }
    return () => {
      mountedRef.current = false;
      dispatch(resetRewardsMoneyReferralMe());
    };
  }, [dispatch, fetchOnMount, fetchReferralMe]);

  return { referralMe, isSettled, fetchReferralMe };
}

/**
 * Reads referral me back with `forceFresh`, retrying while the session
 * changes mid-read. A failed or discarded read still lets the accepted
 * screen open.
 *
 * @param fetchReferralMe - The sheet's referral-me fetch.
 */
export async function refreshReferralMeWithRetries(
  fetchReferralMe: (options?: {
    forceFresh?: boolean;
  }) => Promise<FetchReferralMeResult>,
): Promise<void> {
  for (
    let attempt = 0;
    attempt < MAX_REFERRAL_ME_REFRESH_ATTEMPTS;
    attempt += 1
  ) {
    const result = await fetchReferralMe({ forceFresh: true });
    if (result.status === 'settled') {
      return;
    }
  }
}
