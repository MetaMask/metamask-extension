import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getRewardsSeasonMetadata,
  getRewardsSeasonStatus,
} from '../../store/actions';
import { MetaMaskReduxDispatch } from '../../store/store';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  SeasonDtoState,
  SeasonStatusState,
} from '../../../shared/types/rewards';
import { selectRewardsEnabled } from '../../ducks/rewards/selectors';
import {
  setSeasonStatus,
  setSeasonStatusError,
  setSeasonStatusLoading,
} from '../../ducks/rewards';
import { CandidateSubscriptionId } from '../../ducks/rewards/types';
import { REWARDS_ERROR_MESSAGES } from '../../../shared/constants/rewards';
import { useAsyncResult } from '../useAsync';

type UseSeasonStatusOptions = {
  subscriptionId: CandidateSubscriptionId;
  onAuthorizationError: () => Promise<void>;
};

type UseSeasonStatusReturn = {
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
  const isRewardsEnabled = useSelector(selectRewardsEnabled);

  const isLoadingFor = useRef<CandidateSubscriptionId | null>(null);

  const fetchSeasonStatus = useCallback(async (): Promise<void> => {
    // Don't fetch if no subscriptionId or season metadata
    if (
      !subscriptionId ||
      subscriptionId === 'pending' ||
      subscriptionId === 'retry' ||
      subscriptionId === 'error' ||
      !isRewardsEnabled
    ) {
      dispatch(setSeasonStatus(null));
      dispatch(setSeasonStatusError(null));
      dispatch(setSeasonStatusLoading(false));
      return;
    }

    if (
      Boolean(isLoadingFor.current) &&
      isLoadingFor.current === subscriptionId
    ) {
      return;
    }

    isLoadingFor.current = subscriptionId;

    dispatch(setSeasonStatusLoading(true));

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

      dispatch(setSeasonStatus(statusData));
      dispatch(setSeasonStatusError(null));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      dispatch(setSeasonStatusError(errorMessage));

      // If authorization failed or season not found, trigger callback
      if (
        (errorMessage.includes(REWARDS_ERROR_MESSAGES.AUTHORIZATION_FAILED) ||
          errorMessage.includes(REWARDS_ERROR_MESSAGES.SEASON_NOT_FOUND)) &&
        onAuthorizationError
      ) {
        await onAuthorizationError();
        dispatch(setSeasonStatus(null));
      }
    } finally {
      isLoadingFor.current = null;
      dispatch(setSeasonStatusLoading(false));
    }
  }, [subscriptionId, onAuthorizationError, isRewardsEnabled, dispatch]);

  // Fetch season status when dependencies change
  useEffect(() => {
    if (isUnlocked && subscriptionId) {
      fetchSeasonStatus();
    }
  }, [isUnlocked, fetchSeasonStatus, subscriptionId]);

  return {
    fetchSeasonStatus,
  };
};

/**
 * Hook to check if it's currently rewards season.
 * Returns a loading state and a boolean indicating if it's rewards season
 * (based on current timestamp being within the season's start and end dates).
 */
export const useRewardsSeasonCheck = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const { value: isRewardsSeason, pending } =
    useAsyncResult<boolean>(async () => {
      const seasonMetadata = await dispatch(
        getRewardsSeasonMetadata('current'),
      );

      if (!seasonMetadata) {
        return false;
      }

      const currentTimestamp = Date.now();
      return (
        currentTimestamp >= seasonMetadata.startDate &&
        currentTimestamp <= seasonMetadata.endDate
      );
    }, [dispatch]);

  return {
    pending,
    isRewardsSeason: isRewardsSeason ?? false,
  };
};
