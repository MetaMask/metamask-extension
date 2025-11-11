import { useState, useCallback, useEffect } from 'react';
import log from 'loglevel';
import { useSelector, useDispatch } from 'react-redux';
import { getRewardsCandidateSubscriptionId } from '../../store/actions';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { useAppSelector } from '../../store/store';
import { useRewardsEnabled } from './useRewardsEnabled';

type UseCandidateSubscriptionIdReturn = {
  candidateSubscriptionId: string | null;
  candidateSubscriptionIdError: boolean;
  fetchCandidateSubscriptionId: () => Promise<void>;
};

/**
 * Hook to fetch and manage candidate subscription ID
 */
export const useCandidateSubscriptionId =
  (): UseCandidateSubscriptionIdReturn => {
    const dispatch = useDispatch();
    const [candidateSubscriptionId, setCandidateSubscriptionId] = useState<
      string | null
    >(null);
    const [candidateSubscriptionIdError, setCandidateSubscriptionIdError] =
      useState(false);
    const isUnlocked = useSelector(getIsUnlocked);
    const isRewardsEnabled = useRewardsEnabled();
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
          setCandidateSubscriptionId(null);
          setCandidateSubscriptionIdError(false);
          return;
        }
        const candidateId = (await dispatch(
          getRewardsCandidateSubscriptionId(),
        )) as unknown as string | null;
        setCandidateSubscriptionId(candidateId);
        setCandidateSubscriptionIdError(false);
      } catch (error) {
        log.error(
          '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
          error,
        );
        setCandidateSubscriptionIdError(true);
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
      candidateSubscriptionId,
      candidateSubscriptionIdError,
      fetchCandidateSubscriptionId,
    };
  };
