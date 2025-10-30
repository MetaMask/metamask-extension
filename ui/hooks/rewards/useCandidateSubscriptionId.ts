import { useCallback, useEffect } from 'react';
import log from 'loglevel';
import { useSelector, useDispatch } from 'react-redux';
import { getRewardsCandidateSubscriptionId } from '../../store/actions';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { useAppSelector } from '../../store/store';
import {
  selectCandidateSubscriptionId,
  selectRewardsEnabled,
} from '../../ducks/rewards/selectors';
import {
  setCandidateSubscriptionId,
  setCandidateSubscriptionIdError,
  setCandidateSubscriptionIdLoading,
} from '../../ducks/rewards';

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
    const rewardsActiveAccountCaipAccountId = useAppSelector(
      (state) => state.metamask.rewardsActiveAccount?.account,
    );
    const rewardsSubscriptions = useAppSelector(
      (state) => state.metamask.rewardsSubscriptions,
    );

    const fetchCandidateSubscriptionId = useCallback(async () => {
      try {
        if (!isRewardsEnabled) {
          dispatch(setCandidateSubscriptionId(null));
          dispatch(setCandidateSubscriptionIdLoading(false));
          dispatch(setCandidateSubscriptionIdError(false));
          return;
        }
        dispatch(setCandidateSubscriptionIdLoading(true));
        const candidateId = (await dispatch(
          getRewardsCandidateSubscriptionId(),
        )) as unknown as string | null;
        dispatch(setCandidateSubscriptionId(candidateId));
        dispatch(setCandidateSubscriptionIdError(false));
      } catch (error) {
        log.error(
          '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
          error,
        );
        dispatch(setCandidateSubscriptionIdError(true));
      } finally {
        dispatch(setCandidateSubscriptionIdLoading(false));
      }
    }, [isRewardsEnabled, dispatch]);

    useEffect(() => {
      if (
        isUnlocked &&
        rewardsActiveAccountCaipAccountId &&
        (!candidateSubscriptionId ||
          rewardsActiveAccountSubscriptionId !== candidateSubscriptionId)
      ) {
        fetchCandidateSubscriptionId();
      }
    }, [
      isUnlocked,
      fetchCandidateSubscriptionId,
      rewardsActiveAccountCaipAccountId,
      rewardsActiveAccountSubscriptionId,
      candidateSubscriptionId,
      rewardsSubscriptions,
    ]);
    return {
      fetchCandidateSubscriptionId,
    };
  };
