import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';
import {
  getRewardsSeasonMetadata,
  getRewardsSeasonStatus,
} from '../../store/actions';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  SeasonDtoState,
  SeasonStatusState,
} from '../../../shared/types/rewards';
import { useAppSelector } from '../../store/store';
import { useRewardsEnabled } from './useRewardsEnabled';

type UseSeasonStatusOptions = {
  subscriptionId: string | null;
  onAuthorizationError: () => Promise<void>;
};

type UseSeasonStatusReturn = {
  seasonStatus: SeasonStatusState | null;
  seasonStatusError: string | null;
  seasonStatusLoading: boolean;
  fetchSeasonStatus: () => Promise<void>;
};

/**
 * Hook to fetch and manage season status
 *
 * @param options0
 * @param options0.subscriptionId
 * @param options0.onAuthorizationError
 */
export const useSeasonStatus = ({
  subscriptionId,
  onAuthorizationError,
}: UseSeasonStatusOptions): UseSeasonStatusReturn => {
  const dispatch = useDispatch();
  const isUnlocked = useSelector(getIsUnlocked);
  const isRewardsEnabled = useRewardsEnabled();
  const [seasonStatus, setSeasonStatus] = useState<SeasonStatusState | null>(
    null,
  );
  const [seasonStatusError, setSeasonStatusError] = useState<string | null>(
    null,
  );
  const [seasonStatusLoading, setSeasonStatusLoading] = useState(false);
  const activeRewardsCaipAccountId = useAppSelector(
    (state) => state.metamask.rewardsActiveAccount?.account,
  );
  const isLoading = useRef(false);

  const fetchSeasonStatus = useCallback(async (): Promise<void> => {
    // Don't fetch if no subscriptionId or season metadata
    if (!subscriptionId || !isRewardsEnabled) {
      setSeasonStatus(null);
      setSeasonStatusLoading(false);
      return;
    }

    if (isLoading.current) {
      return;
    }

    isLoading.current = true;

    setSeasonStatusLoading(true);

    try {
      const currentSeasonMetadata = (await dispatch(
        getRewardsSeasonMetadata('current'),
      )) as unknown as SeasonDtoState | null;

      if (!currentSeasonMetadata) {
        throw new Error('No season metadata found');
      }

      const statusData = (await dispatch(
        getRewardsSeasonStatus(subscriptionId, currentSeasonMetadata.id),
      )) as unknown as SeasonStatusState | null;

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
        setSeasonStatus(null);
      }
    } finally {
      setSeasonStatusLoading(false);
      isLoading.current = false;
    }
  }, [subscriptionId, onAuthorizationError, isRewardsEnabled, dispatch]);

  // Fetch season status when dependencies change
  useEffect(() => {
    if (isUnlocked && activeRewardsCaipAccountId) {
      fetchSeasonStatus();
    }
  }, [isUnlocked, fetchSeasonStatus, activeRewardsCaipAccountId]);

  return {
    seasonStatus,
    seasonStatusError,
    seasonStatusLoading,
    fetchSeasonStatus,
  };
};
