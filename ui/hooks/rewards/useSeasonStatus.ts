import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { submitRequestToBackground } from '../../store/background-connection';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { useRewardsEnabled } from './useRewardsEnabled';
import { SeasonDtoState, SeasonStatusState } from '../../../shared/types/rewards';

interface UseSeasonStatusOptions {
  subscriptionId: string | null;
  onAuthorizationError: () => Promise<void>;
}

interface UseSeasonStatusReturn {
  seasonStatus: SeasonStatusState | null;
  seasonStatusError: string | null;
  seasonStatusLoading: boolean;
  fetchSeasonStatus: () => Promise<void>;
}

/**
 * Hook to fetch and manage season status
 */
export const useSeasonStatus = ({
  subscriptionId,
  onAuthorizationError,
}: UseSeasonStatusOptions): UseSeasonStatusReturn => {
  const isUnlocked = useSelector(getIsUnlocked);
  const isRewardsEnabled = useRewardsEnabled();
  const [seasonStatus, setSeasonStatus] = useState<SeasonStatusState | null>(
    null,
  );
  const [seasonStatusError, setSeasonStatusError] = useState<string | null>(
    null,
  );
  const [seasonStatusLoading, setSeasonStatusLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const fetchSeasonStatus = useCallback(async (): Promise<void> => {
    // Don't fetch if no subscriptionId or season metadata
    if (!subscriptionId) {
      setSeasonStatus(null);
      setSeasonStatusLoading(false);
      return;
    }

    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;

    setSeasonStatusLoading(true);

    try {
      const currentSeasonMetadata =
        await submitRequestToBackground<SeasonDtoState>(
          'getRewardsSeasonMetadata',
          ['current'],
        );

      if (!currentSeasonMetadata) {
        throw new Error('No season metadata found');
      }

      const statusData = await submitRequestToBackground<SeasonStatusState>(
        'getRewardsSeasonStatus',
        [subscriptionId, currentSeasonMetadata.id],
      );

      setSeasonStatus(statusData);
      setSeasonStatusError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      log.error('[useSeasonStatus] Error fetching season status:', error);
      setSeasonStatusError(errorMessage);

      // If authorization failed, trigger callback
      if (
        (errorMessage.includes('Authorization') ||
          errorMessage.includes('Unauthorized')) &&
        onAuthorizationError
      ) {
        await onAuthorizationError();
      }
    } finally {
      isLoadingRef.current = false;
      setSeasonStatusLoading(false);
    }
  }, [subscriptionId, onAuthorizationError]);

  // Fetch season status when dependencies change
  useEffect(() => {
    if (!isRewardsEnabled) {
      return;
    }

    if (isUnlocked && subscriptionId) {
      fetchSeasonStatus();
    }
  }, [isUnlocked, isRewardsEnabled, subscriptionId, fetchSeasonStatus]);

  // TODO: invalidate by reward events
  // () =>
  // onlyForExplicitFetch
  //   ? []
  //   : [
  //       'RewardsController:accountLinked' as const,
  //       'RewardsController:rewardClaimed' as const,
  //       'RewardsController:balanceUpdated' as const,
  //     ],
  // [onlyForExplicitFetch],
  // );

  // useInvalidateByRewardEvents(invalidateEvents, fetchSeasonStatus);

  return {
    seasonStatus,
    seasonStatusError,
    seasonStatusLoading,
    fetchSeasonStatus,
  };
};
