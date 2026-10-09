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
  /** Why a read was ignored. Only set when `status` is `discarded`. */
  reason?: 'unmounted' | 'superseded' | 'session-changed';
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
 * The controller copies `sessionChanged` onto `error.data`. After the
 * background RPC boundary that bag is also on `error.data.cause`.
 *
 * @param error - The thrown referral-me error.
 * @returns Whether the read should be discarded and retried.
 */
function isRewardsMoneySessionChangedError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return false;
  }
  const { data } = error as {
    data?: {
      sessionChanged?: boolean;
      cause?: {
        sessionChanged?: boolean;
        data?: { sessionChanged?: boolean };
      };
    };
  };
  if (!data) {
    return false;
  }
  if (data.sessionChanged === true) {
    return true;
  }
  const { cause } = data;
  return cause?.sessionChanged === true || cause?.data?.sessionChanged === true;
}

/**
 * Loads referral me for the invite sheet and stores the payload on the
 * rewards-money slice. A superseded or session-changed read is discarded.
 * The mount effect retries a session change, then marks the read settled if
 * it keeps changing so the invite can close instead of staying blank.
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
        if (!mountedRef.current) {
          return { status: 'discarded', reason: 'unmounted' };
        }
        if (generation !== generationRef.current) {
          return { status: 'discarded', reason: 'superseded' };
        }
        dispatch(setRewardsMoneyReferralMe(data));
        return { status: 'settled' };
      } catch (error) {
        if (!mountedRef.current) {
          return { status: 'discarded', reason: 'unmounted' };
        }
        if (generation !== generationRef.current) {
          return { status: 'discarded', reason: 'superseded' };
        }
        if (isRewardsMoneySessionChangedError(error)) {
          return { status: 'discarded', reason: 'session-changed' };
        }
        dispatch(setRewardsMoneyReferralMeSettled(true));
        return { status: 'settled' };
      }
    },
    [dispatch],
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const loadReferralMeOnMount = async () => {
      for (
        let attempt = 0;
        attempt < MAX_REFERRAL_ME_REFRESH_ATTEMPTS;
        attempt += 1
      ) {
        const result = await fetchReferralMe(
          attempt === 0 ? {} : { forceFresh: true },
        );
        if (cancelled || !mountedRef.current) {
          return;
        }
        if (result.status === 'settled') {
          return;
        }
        if (result.reason !== 'session-changed') {
          return;
        }
      }
      if (!cancelled && mountedRef.current) {
        dispatch(setRewardsMoneyReferralMeSettled(true));
      }
    };

    if (fetchOnMount) {
      // Failures are recorded on the slice. This only stops an unhandled rejection.
      loadReferralMeOnMount().catch(() => undefined);
    }

    return () => {
      cancelled = true;
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
