import React, { useCallback } from 'react';
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
} from '../../../../ducks/rewards/selectors';
import { setOnboardingModalOpen } from '../../../../ducks/rewards';
import { OnboardingStep } from '../../../../ducks/rewards/types';
import OnboardingIntroStep from './onboarding-intro-step';
import OnboardingStep1 from './onboarding-step-1';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingModal() {
  const isOpen = useSelector(selectOnboardingModalOpen);
  const onboardingStep = useSelector(selectOnboardingActiveStep);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(setOnboardingModalOpen(false));
  }, [dispatch]);

  const renderContent = useCallback(() => {
    switch (onboardingStep) {
      case OnboardingStep.INTRO:
        return <OnboardingIntroStep />;
      case OnboardingStep.STEP_1:
        return <OnboardingStep1 />;
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
          data-theme={ThemeType.dark}
          closeButtonProps={{
            className: 'absolute top-2 right-2 z-10',
          }}
          paddingBottom={0}
          onClose={handleClose}
        />

        {renderContent()}
      </ModalContent>
    </Modal>
  );
}
