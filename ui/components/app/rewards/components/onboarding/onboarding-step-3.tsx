import { useDispatch } from 'react-redux';
import React, { useCallback } from 'react';
import { setOnboardingActiveStep } from '../../../../../ducks/rewards';
import { OnboardingStep } from '../../../../../ducks/rewards/types';
import {
  Box,
  Button,
  ButtonSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { ModalBody } from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const OnboardingStep3: React.FC = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const handleNext = useCallback(() => {
    dispatch(setOnboardingActiveStep(OnboardingStep.STEP_4));
  }, [dispatch]);

  const renderStepImage = () => (
    <>
      <svg
        className="w-full absolute"
        viewBox="0 0 393 454"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{ left: 0 }}
      >
        <path
          d="M 294.88086 0 L 197.81836 90.767578 L 197.81836 181.53516 L 294.88086 181.53516 L 294.93555 181.48438 L 294.93555 181.54102 L 197.94922 181.54102 L 197.94922 272 L 99 272 L 0 362.99805 L 0 454 L 99 454 L 198 362.99805 L 198 362.81641 L 294.84375 272.27148 L 294.93555 272.27148 L 294.93555 362.11914 L 392 362.11914 L 392 181.35938 L 295.06836 181.35938 L 391.94336 90.767578 L 391.94336 0 L 294.88086 0 z "
          fill="var(--color-background-muted)"
        />
      </svg>

      <img
        src="/images/rewards/rewards-onboarding-step3.png"
        className="w-full z-10 object-contain"
      />
    </>
  );

  const renderStepInfo = () => (
    <Box className="flex flex-col min-h-30 gap-2">
      <Text variant={TextVariant.HeadingLg} className="text-center">
        {t('rewardsOnboardingStep3Title')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-center text-alternative"
      >
        {t('rewardsOnboardingStep3Description')}
      </Text>
    </Box>
  );

  /**
   * Renders the action buttons section
   */
  const renderActions = () => (
    <Box className="flex flex-col justify-end flex-1 mb-2">
      <Button
        size={ButtonSize.Lg}
        onClick={handleNext}
        className="w-full bg-white my-2"
      >
        {t('rewardsOnboardingStepConfirm')}
      </Button>
    </Box>
  );

  return (
    <ModalBody className="w-full h-full pt-8 pb-4 flex flex-col">
      {/* Image Section */}
      {renderStepImage()}

      {/* Title Section */}
      {renderStepInfo()}

      {/* Actions Section */}
      {renderActions()}
    </ModalBody>
  );
};

export default OnboardingStep3;
