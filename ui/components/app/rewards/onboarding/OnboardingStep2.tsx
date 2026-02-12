import { useDispatch } from 'react-redux';
import React, { useCallback } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { setOnboardingActiveStep } from '../../../../ducks/rewards';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import { ModalBody } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ProgressIndicator from './ProgressIndicator';

const OnboardingStep2: React.FC = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const handleNext = useCallback(() => {
    dispatch(setOnboardingActiveStep(OnboardingStep.STEP3));
  }, [dispatch]);

  const renderStepImage = () => (
    <>
      <svg
        className="w-full absolute"
        viewBox="0 0 393 454"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{ left: 0, top: 0 }}
      >
        <path
          d="M 257.61523 0 L 121.50195 136.11328 L 121.50195 272.51562 L 30.742188 272.51562 L 30.742188 363.25781 L 166.87109 363.25781 L 166.87109 454 L 302.98438 454 L 393.72852 363.25781 L 393.71289 363.25781 L 393.71289 272.51562 L 393.73047 272.51562 L 302.79492 227.04688 L 393.73047 136.11328 L 393.73047 0 L 257.61523 0 z M 30.742188 363.25781 L -60 363.25781 L -60 454 L 30.742188 454 L 30.742188 363.25781 z M -59.998047 45.660156 L -14.626953 136.40234 L 121.48633 136.40234 L 76.115234 45.660156 L -59.998047 45.660156 z M 121.48633 181.76953 L 30.744141 272.51367 L 121.48633 272.51367 L 121.48633 181.76953 z M 212.24414 272.36914 L 212.24414 272.51562 L 165.20898 272.51562 L 212.24414 272.36914 z "
          fill="var(--color-background-muted)"
        />
      </svg>

      <img
        src="https://images.ctfassets.net/9sy2a0egs6zh/2wG5gvQmC4d95TShVVpsEX/9bd7f199f47833fdc68e403a059713df/rewards-onboarding-step2.png"
        className="z-10 object-contain"
        data-testid="rewards-onboarding-step2-image"
        width={'94%'}
      />
    </>
  );

  const renderStepInfo = () => (
    <Box
      className="flex flex-col gap-2 flex-1 justify-end"
      data-testid="rewards-onboarding-step2-info"
    >
      <Text variant={TextVariant.HeadingLg} className="text-center">
        {t('rewardsOnboardingStep2Title')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-center text-alternative"
      >
        {t('rewardsOnboardingStep2Description')}
      </Text>
    </Box>
  );

  /**
   * Renders the action buttons section
   */
  const renderActions = () => (
    <Box
      className="flex flex-col justify-end my-2"
      data-testid="rewards-onboarding-step2-actions"
    >
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={handleNext}
        className="w-full my-2"
      >
        {t('rewardsOnboardingStepConfirm')}
      </Button>
    </Box>
  );

  return (
    <ModalBody
      className="w-full h-full pt-8 pb-4 flex flex-col"
      data-testid="rewards-onboarding-step2-container"
    >
      {/* Progress Indicator */}
      <ProgressIndicator
        totalSteps={4}
        currentStep={2}
        data-testid="rewards-onboarding-step2-progress"
      />

      {/* Image Section */}
      {renderStepImage()}

      {/* Title Section */}
      {renderStepInfo()}

      {/* Actions Section */}
      {renderActions()}
    </ModalBody>
  );
};

export default OnboardingStep2;
