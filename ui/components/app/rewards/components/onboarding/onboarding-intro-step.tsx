import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  FontFamily,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { OnboardingStep } from '../../../../../ducks/rewards/types';
import {
  setOnboardingActiveStep,
  setOnboardingModalOpen,
} from '../../../../../ducks/rewards';
import { ModalBody } from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

/**
 * OnboardingIntroStep Component
 *
 * Main introduction screen for the rewards onboarding flow.
 * Handles geo validation, account type checking, and navigation to next steps.
 */
const OnboardingIntroStep: React.FC = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  /**
   * Handles the confirm/continue button press
   */
  const handleNext = useCallback(async () => {
    // Proceed to next onboarding step
    dispatch(setOnboardingActiveStep(OnboardingStep.STEP_1));
  }, [dispatch]);

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
      className="flex justify-center items-center my-4 absolute"
      style={{ top: 180 }}
    >
      <img
        src="/images/rewards/rewards-onboarding-intro.png"
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
    <Box className="flex flex-col justify-end flex-1">
      <Button
        size={ButtonSize.Lg}
        onClick={handleNext}
        className="w-full bg-white my-2"
      >
        {t('rewardsOnboardingIntroStepConfirm')}
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
            'url(/images/rewards/rewards-onboarding-intro-bg.png)',
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
