import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontFamily,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useTheme } from '../../../../hooks/useTheme';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import {
  setErrorToast,
  setOnboardingActiveStep,
  setOnboardingModalOpen,
} from '../../../../ducks/rewards';
import { ModalBody } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { setStorageItem } from '../../../../../shared/lib/storage-helpers';
import { REWARDS_GTM_MODAL_SHOWN } from '../utils/constants';
import {
  selectCandidateSubscriptionId,
  selectOptinAllowedForGeo,
  selectOptinAllowedForGeoError,
  selectOptinAllowedForGeoLoading,
} from '../../../../ducks/rewards/selectors';
import { useGeoRewardsMetadata } from '../../../../hooks/rewards/useGeoRewardsMetadata';
import { useCandidateSubscriptionId } from '../../../../hooks/rewards/useCandidateSubscriptionId';
import { useAppSelector } from '../../../../store/store';
import { isHardwareWallet } from '../../../../../shared/modules/selectors';

/**
 * OnboardingIntroStep Component
 *
 * Main introduction screen for the rewards onboarding flow.
 * Handles geo validation, account type checking, and navigation to next steps.
 */
const OnboardingIntroStep: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const theme = useTheme();

  const setHasSeenRewardsIntroModal = useCallback(async () => {
    await setStorageItem(REWARDS_GTM_MODAL_SHOWN, 'true');
  }, []);

  useEffect(() => {
    setHasSeenRewardsIntroModal();
  }, [setHasSeenRewardsIntroModal]);

  const optinAllowedForGeo = useSelector(selectOptinAllowedForGeo);
  const optinAllowedForGeoLoading = useSelector(
    selectOptinAllowedForGeoLoading,
  );
  const optinAllowedForGeoError = useSelector(selectOptinAllowedForGeoError);
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const candidateSubscriptionIdError = candidateSubscriptionId === 'error';
  const rewardsActiveAccountSubscriptionId = useAppSelector(
    (state) => state.metamask.rewardsActiveAccount?.subscriptionId,
  );

  const hardwareWalletUsed = useSelector(isHardwareWallet);

  // If we don't know of a subscription id, we need to fetch the geo metadata
  const { fetchGeoRewardsMetadata } = useGeoRewardsMetadata({
    enabled:
      !rewardsActiveAccountSubscriptionId &&
      (!candidateSubscriptionId || candidateSubscriptionIdError),
  });

  const { fetchCandidateSubscriptionId } = useCandidateSubscriptionId();

  /**
   * Handles the confirm/continue button press
   */
  const handleNext = useCallback(async () => {
    // Show error modal if candidate subscription ID fetch failed
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

    // Show error modal if geo check failed
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

    // Show error modal if unsupported region
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

    // Show error modal if hardware wallet
    if (hardwareWalletUsed) {
      dispatch(
        setErrorToast({
          isOpen: true,
          title: t('rewardsOnboardingIntroHardwareWalletTitle'),
          description: t('rewardsOnboardingIntroHardwareWalletDescription'),
        }),
      );
      return;
    }

    // Proceed to next onboarding step
    dispatch(setOnboardingActiveStep(OnboardingStep.STEP1));
  }, [
    candidateSubscriptionIdError,
    dispatch,
    fetchCandidateSubscriptionId,
    fetchGeoRewardsMetadata,
    hardwareWalletUsed,
    optinAllowedForGeo,
    optinAllowedForGeoError,
    optinAllowedForGeoLoading,
    rewardsActiveAccountSubscriptionId,
    t,
  ]);

  /**
   * Handles the close button press
   */
  const handleClose = useCallback(() => {
    dispatch(setOnboardingModalOpen(false));
  }, [dispatch]);

  /**
   * Renders the main title section
   */
  const renderTitle = () => (
    <Box
      className="gap-2"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      data-testid="rewards-onboarding-intro-title"
    >
      <Box className="justify-center items-center">
        <Text
          fontFamily={FontFamily.Hero}
          variant={TextVariant.DisplayLg}
          className={'text-center text-white font-medium'}
          style={{
            lineHeight: '1',
          }}
        >
          {t('rewardsOnboardingIntroTitle')}
        </Text>
      </Box>
      <Text
        variant={TextVariant.BodyMd}
        className={'text-center text-white font-medium'}
      >
        {t('rewardsOnboardingIntroDescription')}
      </Text>
    </Box>
  );

  /**
   * Renders the intro image section
   */
  const renderImage = () => (
    <Box
      className="flex justify-center items-center absolute"
      style={{ top: '25%' }}
      data-testid="rewards-onboarding-intro-image"
    >
      <img
        src="https://images.ctfassets.net/9sy2a0egs6zh/5vsF0CDPAgGRK4VpjxyKT9/e744a921a9666172aa4f92852356ca7a/rewards-onboarding-intro.png"
        alt="Rewards onboarding intro"
        className="w-full max-w-lg h-auto object-contain"
        data-testid="intro-image"
      />
    </Box>
  );

  /**
   * Renders the action buttons section
   */
  const renderActions = () => (
    <Box
      className="flex flex-col justify-end flex-1"
      data-testid="rewards-onboarding-intro-actions"
    >
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        isLoading={
          optinAllowedForGeoLoading ||
          candidateSubscriptionId === 'pending' ||
          candidateSubscriptionId === 'retry'
        }
        isDisabled={
          optinAllowedForGeoLoading ||
          Boolean(rewardsActiveAccountSubscriptionId) ||
          candidateSubscriptionId === 'pending' ||
          candidateSubscriptionId === 'retry'
        }
        onClick={handleNext}
        className={`w-full my-2 bg-white ${theme === 'light' ? 'hover:bg-default-hover' : 'hover:bg-icon-default-hover'}`}
      >
        <Text variant={TextVariant.BodyMd} className="text-black font-medium">
          {t('rewardsOnboardingIntroStepConfirm')}
        </Text>
      </Button>
      <Button
        size={ButtonSize.Lg}
        onClick={handleClose}
        className="w-full bg-gray-500 border-gray-500 hover:bg-primary-default-hover"
      >
        <Text variant={TextVariant.BodyMd} className="text-white font-medium">
          {t('rewardsOnboardingIntroStepSkip')}
        </Text>
      </Button>
    </Box>
  );

  return (
    <Box
      className="w-full h-full overflow-y-auto"
      data-testid="onboarding-intro-container"
    >
      <Box
        className="w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://images.ctfassets.net/9sy2a0egs6zh/3IxIZWE6JZHzDNhlpiLeJq/7e765a752a7ae0b90dd327ddca496175/rewards-onboarding-intro-bg.png)',
        }}
      >
        <ModalBody className="w-full h-full pt-8 pb-4 flex flex-col">
          {/* Title Section */}
          {renderTitle()}

          {/* Image Section */}
          {renderImage()}

          {/* Actions Section */}
          {renderActions()}
        </ModalBody>
      </Box>
    </Box>
  );
};

export default OnboardingIntroStep;
