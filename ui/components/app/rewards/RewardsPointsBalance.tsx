import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { Skeleton } from '../../component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setOnboardingModalOpen,
  setOnboardingModalRendered,
  setRewardsBadgeHidden,
} from '../../../ducks/rewards';
import {
  selectCandidateSubscriptionId,
  selectOnboardingModalRendered,
  selectRewardsBadgeHidden,
  selectRewardsEnabled,
  selectSeasonStatus,
  selectSeasonStatusError,
} from '../../../ducks/rewards/selectors';
import { useCandidateSubscriptionId } from '../../../hooks/rewards/useCandidateSubscriptionId';
import { useSeasonStatus } from '../../../hooks/rewards/useSeasonStatus';
import {
  getStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';
import { useAppSelector } from '../../../store/store';
import { RewardsBadge } from './RewardsBadge';
import {
  REWARDS_BADGE_HIDDEN,
  REWARDS_GTM_MODAL_SHOWN,
} from './utils/constants';

/**
 * Component to display the rewards points balance
 * Shows the points balance or a sign-up badge if the user hasn't opted in yet
 */
export const RewardsPointsBalance = () => {
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsBadgeHidden = useSelector(selectRewardsBadgeHidden);
  const seasonStatus = useSelector(selectSeasonStatus);
  const seasonStatusError = useSelector(selectSeasonStatusError);
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const onboardingModalRendered = useSelector(selectOnboardingModalRendered);
  const rewardsActiveAccountSubscriptionId = useAppSelector(
    (state) => state.metamask.rewardsActiveAccount?.subscriptionId,
  );

  const candidateSubscriptionIdLoading =
    !rewardsActiveAccountSubscriptionId &&
    (candidateSubscriptionId === 'pending' ||
      candidateSubscriptionId === 'retry');
  const candidateSubscriptionIdError = candidateSubscriptionId === 'error';

  const isTestEnv = Boolean(process.env.IN_TEST);

  const openRewardsOnboardingModal = useCallback(() => {
    dispatch(setOnboardingModalOpen(true));
  }, [dispatch]);

  // entry point hooks
  const { fetchCandidateSubscriptionId } = useCandidateSubscriptionId();
  useSeasonStatus({
    subscriptionId: candidateSubscriptionId,
    onAuthorizationError: fetchCandidateSubscriptionId,
  });

  // check has seen rewards onboarding modal
  useEffect(() => {
    const checkHasSeenFlag = async () => {
      try {
        const seenBefore = await getStorageItem(REWARDS_GTM_MODAL_SHOWN);
        dispatch(setOnboardingModalRendered(seenBefore === 'true'));
      } catch (_e) {
        // set to default value
        dispatch(setOnboardingModalRendered(true));
      }
    };
    checkHasSeenFlag();
  }, [dispatch]);

  // check has hidden rewards badge
  useEffect(() => {
    const checkHasHiddenBadge = async () => {
      try {
        const hiddenBefore = await getStorageItem(REWARDS_BADGE_HIDDEN);
        dispatch(setRewardsBadgeHidden(hiddenBefore === 'true'));
      } catch (_e) {
        // set to default value
        dispatch(setRewardsBadgeHidden(true));
      }
    };
    checkHasHiddenBadge();
  }, [dispatch]);

  // dispatch onboarding modal open if not seen before
  useEffect(() => {
    if (
      !isTestEnv &&
      rewardsEnabled &&
      candidateSubscriptionId === null && // determined that it's null
      !rewardsActiveAccountSubscriptionId && // determined that it's not the active account
      !onboardingModalRendered
    ) {
      openRewardsOnboardingModal();
    }
  }, [
    openRewardsOnboardingModal,
    rewardsEnabled,
    isTestEnv,
    candidateSubscriptionId,
    rewardsActiveAccountSubscriptionId,
    onboardingModalRendered,
  ]);

  const setHasSeenOnboardingInStorage = useCallback(async () => {
    try {
      await setStorageItem(REWARDS_GTM_MODAL_SHOWN, 'true');
    } catch (_e) {
      // Silently fail - should not block the user from seeing the points balance
    }
  }, []);

  useEffect(() => {
    if (
      candidateSubscriptionId &&
      candidateSubscriptionId !== 'pending' &&
      candidateSubscriptionId !== 'retry' &&
      candidateSubscriptionId !== 'error'
    ) {
      try {
        setHasSeenOnboardingInStorage();
      } catch (_e) {
        // Silently fail - should not block the user from seeing the points balance
      }
    }
  }, [candidateSubscriptionId, setHasSeenOnboardingInStorage]);

  if (!rewardsEnabled) {
    return null;
  }

  if (!candidateSubscriptionId) {
    return rewardsBadgeHidden ? null : (
      <RewardsBadge
        boxClassName="gap-1 px-1.5 bg-background-muted rounded"
        formattedPoints={t('rewardsSignUp')}
        withPointsSuffix={false}
        onClick={openRewardsOnboardingModal}
        allowHideBadge
      />
    );
  }

  if (
    (seasonStatusError && !seasonStatus?.balance) ||
    candidateSubscriptionIdError
  ) {
    return (
      <RewardsBadge
        formattedPoints={t('rewardsPointsBalance_couldntLoad')}
        withPointsSuffix={false}
        boxClassName="gap-1 bg-background-transparent"
        textClassName="text-alternative"
        useAlternativeIconColor
      />
    );
  }

  if (
    seasonStatus &&
    candidateSubscriptionId &&
    !candidateSubscriptionIdLoading
  ) {
    // Format the points balance with proper locale-aware number formatting
    // Handle null/undefined balance by defaulting to 0
    const balanceTotal = seasonStatus.balance?.total ?? 0;
    const formattedPoints = new Intl.NumberFormat(locale).format(balanceTotal);
    return (
      <RewardsBadge
        formattedPoints={formattedPoints}
        boxClassName="gap-1 px-1.5 bg-background-muted rounded"
        onClick={openRewardsOnboardingModal}
      />
    );
  }

  return rewardsBadgeHidden ? null : <Skeleton width="100px" />;
};
