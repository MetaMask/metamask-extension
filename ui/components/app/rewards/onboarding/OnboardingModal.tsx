import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
} from '../../../component-library';
import { ThemeType } from '../../../../../shared/constants/preferences';
import {
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  selectOnboardingModalOpen,
  selectOnboardingActiveStep,
  selectCandidateSubscriptionId,
} from '../../../../ducks/rewards/selectors';
import {
  setOnboardingActiveStep,
  setOnboardingModalOpen,
  setOnboardingModalRendered,
} from '../../../../ducks/rewards';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import { useTheme } from '../../../../hooks/useTheme';
import RewardsErrorToast from '../RewardsErrorToast';
import OnboardingIntroStep from './OnboardingIntroStep';
import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';
import OnboardingStep4 from './OnboardingStep4';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingModal() {
  const isOpen = useSelector(selectOnboardingModalOpen);
  const onboardingStep = useSelector(selectOnboardingActiveStep);
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const dispatch = useDispatch();

  const theme = useTheme();

  const handleClose = useCallback(() => {
    dispatch(setOnboardingModalOpen(false));
    dispatch(setOnboardingActiveStep(OnboardingStep.INTRO));
  }, [dispatch]);

  const renderContent = useCallback(() => {
    if (
      candidateSubscriptionId &&
      candidateSubscriptionId !== 'error' &&
      candidateSubscriptionId !== 'pending' &&
      candidateSubscriptionId !== 'retry'
    ) {
      // TODO: render mobile QR code
      return null;
    }

    switch (onboardingStep) {
      case OnboardingStep.INTRO:
        return <OnboardingIntroStep />;
      case OnboardingStep.STEP1:
        return <OnboardingStep1 />;
      case OnboardingStep.STEP2:
        return <OnboardingStep2 />;
      case OnboardingStep.STEP3:
        return <OnboardingStep3 />;
      case OnboardingStep.STEP4:
        return <OnboardingStep4 />;
      default:
        return <OnboardingIntroStep />;
    }
  }, [candidateSubscriptionId, onboardingStep]);

  useEffect(() => {
    dispatch(setOnboardingModalRendered(true));
  }, [dispatch]);

  useEffect(() => {
    if (
      candidateSubscriptionId &&
      candidateSubscriptionId !== 'error' &&
      candidateSubscriptionId !== 'pending' &&
      candidateSubscriptionId !== 'retry'
    ) {
      handleClose();
    }
  }, [candidateSubscriptionId, handleClose]);

  return (
    <Modal
      data-testid="rewards-onboarding-modal"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        size={ModalContentSize.Md}
        modalDialogProps={{
          paddingTop: 0,
          paddingBottom: 0,
          style: {
            height: '740px',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <ModalHeader
          data-theme={theme === 'light' ? ThemeType.light : ThemeType.dark}
          data-testid="rewards-onboarding-modal-header"
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
        <RewardsErrorToast />
      </ModalContent>
    </Modal>
  );
}
