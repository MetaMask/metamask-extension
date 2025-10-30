import { useState, useCallback, useEffect } from 'react';
import log from 'loglevel';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../store/background-connection';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
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
    const [candidateSubscriptionId, setCandidateSubscriptionId] = useState<
      string | null
    >(null);
    const [candidateSubscriptionIdError, setCandidateSubscriptionIdError] =
      useState(false);
    const isUnlocked = useSelector(getIsUnlocked);
    const isRewardsEnabled = useRewardsEnabled();

    const fetchCandidateSubscriptionId = useCallback(async () => {
      try {
        const candidateId = await submitRequestToBackground<string>(
          'getCandidateSubscriptionId',
          [],
        );
        setCandidateSubscriptionId(candidateId);
        setCandidateSubscriptionIdError(false);
      } catch (error) {
        log.error(
          '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
          error,
        );
        setCandidateSubscriptionIdError(true);
      }
    }, []);

    // Fetch candidate subscription ID on mount and when unlocked
    useEffect(() => {
      if (!isRewardsEnabled) {
        return;
      }

      if (isUnlocked) {
        fetchCandidateSubscriptionId();
      }
    }, [isUnlocked, isRewardsEnabled, fetchCandidateSubscriptionId]);

    return {
      candidateSubscriptionId,
      candidateSubscriptionIdError,
      fetchCandidateSubscriptionId,
    };
  };
