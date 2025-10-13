import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
} from '../../../../component-library';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import {
  AlignItems,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import {
  selectOnboardingModalOpen,
  selectOnboardingActiveStep,
} from '../../../../../ducks/rewards/selectors';
import { setOnboardingModalOpen } from '../../../../../ducks/rewards';
import { OnboardingStep } from '../../../../../ducks/rewards/types';
import { useTheme } from '../../../../../hooks/useTheme';
import OnboardingIntroStep from './onboarding-intro-step';
import OnboardingStep1 from './onboarding-step-1';
import OnboardingStep2 from './onboarding-step-2';
import OnboardingStep3 from './onboarding-step-3';
import OnboardingStep4 from './onboarding-step-4';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingModal() {
  const isOpen = useSelector(selectOnboardingModalOpen);
  const onboardingStep = useSelector(selectOnboardingActiveStep);
  const dispatch = useDispatch();

  const theme = useTheme();

  const handleClose = useCallback(() => {
    dispatch(setOnboardingModalOpen(false));
  }, [dispatch]);

  const renderContent = useCallback(() => {
    switch (onboardingStep) {
      case OnboardingStep.INTRO:
        return <OnboardingIntroStep />;
      case OnboardingStep.STEP_1:
        return <OnboardingStep1 />;
      case OnboardingStep.STEP_2:
        return <OnboardingStep2 />;
      case OnboardingStep.STEP_3:
        return <OnboardingStep3 />;
      case OnboardingStep.STEP_4:
        return <OnboardingStep4 />;
      default:
        return <OnboardingIntroStep />;
    }
  }, [onboardingStep]);

  return (
    <Modal
      data-testid="rewards-onboarding-modal"
      isOpen={isOpen}
      onClose={handleClose}
      className="rewards-onboarding-modal"
    >
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        size={ModalContentSize.Md}
        modalDialogProps={{
          paddingTop: 0,
          paddingBottom: 0,
          style: { height: '800px' },
        }}
      >
        <ModalHeader
          data-theme={theme === 'light' ? ThemeType.light : ThemeType.dark}
          closeButtonProps={{
            className: 'absolute z-10',
            style: {
              top: '24px',
              right: '12px',
              display:
                onboardingStep === OnboardingStep.INTRO ? 'none' : 'block',
            },
          }}
          paddingBottom={0}
          onClose={handleClose}
        />

        {renderContent()}
      </ModalContent>
    </Modal>
  );
}
