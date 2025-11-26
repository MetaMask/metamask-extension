import { useCallback, useEffect, useRef } from 'react';
import log from 'loglevel';
import { useSelector, useDispatch } from 'react-redux';
import { getRewardsCandidateSubscriptionId } from '../../store/actions';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  selectCandidateSubscriptionId,
  selectRewardsEnabled,
} from '../../ducks/rewards/selectors';
import { setCandidateSubscriptionId } from '../../ducks/rewards';
import { useAppSelector } from '../../store/store';

type UseCandidateSubscriptionIdReturn = {
  fetchCandidateSubscriptionId: () => Promise<void>;
};

/**
 * Hook to fetch and manage candidate subscription ID
 */
export const useCandidateSubscriptionId =
  (): UseCandidateSubscriptionIdReturn => {
    const dispatch = useDispatch();

    const isUnlocked = useSelector(getIsUnlocked);
    const isRewardsEnabled = useSelector(selectRewardsEnabled);
    const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
    const rewardsActiveAccountSubscriptionId = useAppSelector(
      (state) => state.metamask.rewardsActiveAccount?.subscriptionId,
    );

    const isLoading = useRef(false);

    const fetchCandidateSubscriptionId = useCallback(async () => {
      try {
        if (!isRewardsEnabled) {
          dispatch(setCandidateSubscriptionId(null));
          return;
        }
        if (rewardsActiveAccountSubscriptionId) {
          isLoading.current = false;
          dispatch(
            setCandidateSubscriptionId(rewardsActiveAccountSubscriptionId),
          );
          return;
        }
        if (isLoading.current) {
          return;
        }
        isLoading.current = true;

        const candidateId = (await dispatch(
          getRewardsCandidateSubscriptionId(),
        )) as unknown as string | null;
        dispatch(setCandidateSubscriptionId(candidateId));
      } catch (error) {
        log.error(
          '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
          error,
        );
        dispatch(setCandidateSubscriptionId('error'));
      } finally {
        isLoading.current = false;
      }
    }, [isRewardsEnabled, dispatch, rewardsActiveAccountSubscriptionId]);

    useEffect(() => {
      if (candidateSubscriptionId === 'retry') {
        fetchCandidateSubscriptionId();
      }
    }, [candidateSubscriptionId, fetchCandidateSubscriptionId]);

    useEffect(() => {
      if (isUnlocked) {
        fetchCandidateSubscriptionId();
      }
    }, [fetchCandidateSubscriptionId, isUnlocked]);

    return {
      fetchCandidateSubscriptionId,
    };
  };
