import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { Skeleton } from '../../component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setOnboardingModalOpen } from '../../../ducks/rewards';
import {
  selectCandidateSubscriptionId,
  selectCandidateSubscriptionIdLoading,
  selectRewardsEnabled,
  selectSeasonStatus,
  selectSeasonStatusError,
  selectSeasonStatusLoading,
} from '../../../ducks/rewards/selectors';
import { useCandidateSubscriptionId } from '../../../hooks/rewards/useCandidateSubscriptionId';
import { useSeasonStatus } from '../../../hooks/rewards/useSeasonStatus';
import { getStorageItem } from '../../../../shared/lib/storage-helpers';
import { RewardsBadge } from './RewardsBadge';
import { REWARDS_GTM_MODAL_SHOWN } from './utils/constants';

/**
 * Component to display the rewards points balance
 * Shows the points balance or a sign-up badge if the user hasn't opted in yet
 */
export const RewardsPointsBalance = () => {
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const openRewardsModal = useCallback(() => {
    dispatch(setOnboardingModalOpen(true));
  }, [dispatch]);

  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const seasonStatus = useSelector(selectSeasonStatus);
  const seasonStatusLoading = useSelector(selectSeasonStatusLoading);
  const seasonStatusError = useSelector(selectSeasonStatusError)
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const candidateSubscriptionIdLoading = useSelector(
    selectCandidateSubscriptionIdLoading,
  );
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const isTestEnv = Boolean(process.env.IN_TEST);

  // entry point hooks
  const { fetchCandidateSubscriptionId } = useCandidateSubscriptionId();
  useSeasonStatus({
    subscriptionId: candidateSubscriptionId,
    onAuthorizationError: fetchCandidateSubscriptionId,
  });

  useEffect(() => {
    const checkHasSeenFlag = async () => {
      try {
        const seenBefore = await getStorageItem(REWARDS_GTM_MODAL_SHOWN);
        setHasSeenOnboarding(seenBefore === 'true');
      } catch (_e) {
        setHasSeenOnboarding(false);
      }
    };
    checkHasSeenFlag();
  }, []);

  // dispatch onboarding modal open if not seen before
  useEffect(() => {
    if (!isTestEnv && rewardsEnabled && !hasSeenOnboarding) {
      openRewardsModal();
    }
  }, [hasSeenOnboarding, openRewardsModal, rewardsEnabled, isTestEnv]);

  if (!rewardsEnabled) {
    return null;
  }

  if (!candidateSubscriptionId && !candidateSubscriptionIdLoading) {
    return (
      <RewardsBadge
        boxClassName="gap-1 px-1.5 bg-background-muted rounded"
        formattedPoints={t('rewardsSignUp')}
        withPointsSuffix={false}
        onClick={openRewardsModal}
      />
    );
  }

  if (
    (seasonStatusLoading && !seasonStatus?.balance) ||
    (candidateSubscriptionIdLoading && !candidateSubscriptionId)
  ) {
    return <Skeleton width="100px" />;
  }

  if (seasonStatusError && !seasonStatus?.balance) {
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

  // Format the points balance with proper locale-aware number formatting
  const formattedPoints = new Intl.NumberFormat(locale).format(
    seasonStatus?.balance?.total ?? 0,
  );

  return (
    <RewardsBadge
      formattedPoints={formattedPoints}
      boxClassName="gap-1 px-1.5 bg-background-muted rounded"
    />
  );
};
