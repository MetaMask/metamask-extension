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

const OnboardingStep1: React.FC = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const handleNext = useCallback(() => {
    dispatch(setOnboardingActiveStep(OnboardingStep.STEP2));
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
          d="M 302.98438 0 L 213.17773 113.25586 L 162.85742 113.25586 L 162.85742 224.83594 L 162.84766 224.83594 L 162.84766 113.09766 L 62.902344 113.09766 L -37.042969 226.49805 L -37.042969 339.89844 L 62.902344 339.89844 L 162.8125 226.53711 L 162.8125 339.9707 L 212.77539 339.9707 L 212.77539 340.4043 L 302.69336 453.79883 L 392.61523 453.79883 L 392.61523 340.4043 L 361.58008 301.26758 L 361.58008 224.83594 L 304.5332 224.83594 L 392.90625 113.39453 L 392.90625 0 L 302.98438 0 z "
          fill="var(--color-background-muted)"
        />
      </svg>

      <img
        src="https://images.ctfassets.net/9sy2a0egs6zh/5ieKFEvd1qM3crY76W751i/ab846811e550d4a84c12a063f468f30c/rewards-onboarding-step1.png"
        className="z-10 object-contain"
        data-testid="rewards-onboarding-step1-image"
        width={'94%'}
      />
    </>
  );

  const renderStepInfo = () => (
    <Box
      className="flex flex-col gap-2 flex-1 justify-end"
      data-testid="rewards-onboarding-step1-info"
    >
      <Text variant={TextVariant.HeadingLg} className="text-center">
        {t('rewardsOnboardingStep1Title')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-center text-alternative"
      >
        {t('rewardsOnboardingStep1Description')}
      </Text>
    </Box>
  );

  /**
   * Renders the action buttons section
   */
  const renderActions = () => (
    <Box
      className="flex flex-col my-2"
      data-testid="rewards-onboarding-step1-actions"
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
      data-testid="rewards-onboarding-step1-container"
    >
      {/* Progress Indicator */}
      <ProgressIndicator
        totalSteps={4}
        currentStep={1}
        data-testid="rewards-onboarding-step1-progress"
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

export default OnboardingStep1;
