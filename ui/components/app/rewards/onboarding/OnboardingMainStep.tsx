import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextButton,
  TextButtonSize,
  TextVariant,
} from '@metamask/design-system-react';
import { ModalBody } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useOptIn } from '../../../../hooks/rewards/useOptIn';
import { useGeoRewardsMetadata } from '../../../../hooks/rewards/useGeoRewardsMetadata';
import { useCandidateSubscriptionId } from '../../../../hooks/rewards/useCandidateSubscriptionId';
import { setErrorToast } from '../../../../ducks/rewards';
import {
  selectCandidateSubscriptionId,
  selectOptinAllowedForGeo,
  selectOptinAllowedForGeoError,
  selectOptinAllowedForGeoLoading,
} from '../../../../ducks/rewards/selectors';
import { useAppSelector, useDispatch } from '../../../../store/hooks';
import RewardsErrorBanner from '../RewardsErrorBanner';

import {
  REWARDS_ONBOARD_HERO_IMAGE_URL,
  REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
  REWARDS_ONBOARD_TERMS_URL,
} from './constants';

type OnboardingMainStepProps = {
  rewardPoints?: number;
  shieldSubscriptionId?: string;
};

const OnboardingMainStep: React.FC<OnboardingMainStepProps> = ({
  rewardPoints,
  shieldSubscriptionId,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { optin, optinLoading, optinError } = useOptIn({
    rewardPoints,
    shieldSubscriptionId,
  });

  const optinAllowedForGeo = useSelector(selectOptinAllowedForGeo);
  const optinAllowedForGeoLoading = useSelector(
    selectOptinAllowedForGeoLoading,
  );
  const optinAllowedForGeoError = useSelector(selectOptinAllowedForGeoError);
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const candidateSubscriptionIdError =
    candidateSubscriptionId === 'error' ||
    candidateSubscriptionId ===
      'error-existing-subscription-hardware-wallet-explicit-sign';
  const rewardsActiveAccountSubscriptionId = useAppSelector(
    (state) => state.metamask.rewardsActiveAccount?.subscriptionId,
  );

  const { fetchGeoRewardsMetadata } = useGeoRewardsMetadata({
    enabled:
      !rewardsActiveAccountSubscriptionId &&
      (!candidateSubscriptionId || candidateSubscriptionIdError),
  });
  const { fetchCandidateSubscriptionId } = useCandidateSubscriptionId();

  const handleNext = useCallback(async () => {
    if (candidateSubscriptionIdError) {
      dispatch(
        setErrorToast({
          isOpen: true,
          title: t('rewardsAuthFailTitle'),
          description: t('rewardsAuthFailDescription'),
          onActionClick: fetchCandidateSubscriptionId,
          actionText: t('rewardsOnboardingIntroRewardsAuthFailRetry'),
        }),
      );
      return;
    }

    if (
      optinAllowedForGeoError &&
      !optinAllowedForGeo &&
      !optinAllowedForGeoLoading &&
      !rewardsActiveAccountSubscriptionId
    ) {
      dispatch(
        setErrorToast({
          isOpen: true,
          title: t('rewardsOnboardingIntroGeoCheckFailedTitle'),
          description: t('rewardsOnboardingIntroGeoCheckFailedDescription'),
          onActionClick: fetchGeoRewardsMetadata,
          actionText: t('rewardsOnboardingIntroGeoCheckRetry'),
        }),
      );
      return;
    }

    if (optinAllowedForGeo === false) {
      dispatch(
        setErrorToast({
          isOpen: true,
          title: t('rewardsOnboardingIntroUnsupportedRegionTitle'),
          description: t('rewardsOnboardingIntroUnsupportedRegionDescription'),
        }),
      );
      return;
    }

    await optin();
  }, [
    candidateSubscriptionIdError,
    dispatch,
    fetchCandidateSubscriptionId,
    fetchGeoRewardsMetadata,
    optin,
    optinAllowedForGeo,
    optinAllowedForGeoError,
    optinAllowedForGeoLoading,
    rewardsActiveAccountSubscriptionId,
    t,
  ]);

  const isCtaLoading =
    optinLoading ||
    optinAllowedForGeoLoading ||
    candidateSubscriptionId === 'pending' ||
    candidateSubscriptionId === 'retry';

  const isCtaDisabled =
    isCtaLoading || Boolean(rewardsActiveAccountSubscriptionId);

  let ctaLoadingText: string | undefined;
  if (isCtaLoading) {
    if (optinLoading) {
      ctaLoadingText = t('rewardsOnboardingSignUpLoading');
    } else {
      ctaLoadingText = t('rewardsOnboardingCheckingRegion');
    }
  }

  const renderHero = () => (
    <Box
      className="flex justify-center items-center"
      data-testid="rewards-onboarding-main-image"
    >
      <img
        src={REWARDS_ONBOARD_HERO_IMAGE_URL}
        alt={t('rewardsOnboardingTitle')}
        width={180}
        height={180}
        className="object-contain"
      />
    </Box>
  );

  const renderInfo = () => (
    <Box
      className="flex flex-col gap-2"
      data-testid="rewards-onboarding-main-info"
    >
      <Text variant={TextVariant.HeadingLg} className="text-center">
        {t('rewardsOnboardingTitle')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-center text-alternative"
      >
        {t('rewardsOnboardingDescription')}
      </Text>
    </Box>
  );

  const renderActions = () => (
    <Box
      className="flex flex-col w-full"
      data-testid="rewards-onboarding-main-actions"
    >
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={handleNext}
        className="w-full my-2"
        disabled={isCtaDisabled}
        isDisabled={isCtaDisabled}
        isLoading={isCtaLoading}
        loadingText={ctaLoadingText}
      >
        {t('rewardsOnboardingSignUp')}
      </Button>
    </Box>
  );

  const renderLegalDisclaimer = () => {
    const openTermsOfUse = () => {
      window.open(REWARDS_ONBOARD_TERMS_URL, '_blank', 'noopener,noreferrer');
    };

    const openLearnMore = () => {
      window.open(
        REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
        '_blank',
        'noopener,noreferrer',
      );
    };
    return (
      <Box
        className="w-full flex-row mt-6"
        data-testid="rewards-onboarding-main-legal-disclaimer"
      >
        <Text
          variant={TextVariant.BodySm}
          className="text-alternative text-center"
        >
          {t('rewardsOnboardingLegalDisclaimer', [
            <TextButton
              key="terms"
              size={TextButtonSize.BodySm}
              className="text-primary-default"
              onClick={openTermsOfUse}
            >
              {t('rewardsOnboardingLegalDisclaimerTermsLink')}
            </TextButton>,
            <TextButton
              key="learnMore"
              size={TextButtonSize.BodySm}
              className="text-primary-default"
              onClick={openLearnMore}
            >
              {t('rewardsOnboardingLegalDisclaimerLearnMoreLink')}
            </TextButton>,
          ])}
        </Text>
      </Box>
    );
  };

  return (
    <ModalBody
      className="w-full h-full p-4 flex flex-col gap-12"
      data-testid="rewards-onboarding-main-container"
    >
      {optinError && (
        <RewardsErrorBanner
          title={t('rewardsOnboardingOptInError')}
          description={optinError}
        />
      )}

      <Box className="flex-1 flex flex-col justify-center items-center gap-4 px-4">
        {renderHero()}
        {renderInfo()}
      </Box>

      <Box className="flex flex-col gap-2">
        {renderActions()}
        {renderLegalDisclaimer()}
      </Box>
    </ModalBody>
  );
};

export default OnboardingMainStep;
