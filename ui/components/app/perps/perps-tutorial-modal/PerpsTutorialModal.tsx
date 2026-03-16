import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
} from '../../../component-library';
import { ThemeType } from '../../../../../shared/constants/preferences';
import {
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  selectTutorialModalOpen,
  selectTutorialActiveStep,
  setTutorialModalOpen,
  setTutorialActiveStep,
  markTutorialCompleted,
  PerpsTutorialStep,
  TUTORIAL_STEPS_ORDER,
} from '../../../../ducks/perps';
import { useTheme } from '../../../../hooks/useTheme';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../shared/constants/app';
import WhatArePerpsStep from './steps/WhatArePerpsStep';
import GoLongShortStep from './steps/GoLongShortStep';
import ChooseLeverageStep from './steps/ChooseLeverageStep';
import WatchLiquidationStep from './steps/WatchLiquidationStep';
import CloseAnytimeStep from './steps/CloseAnytimeStep';
import ReadyToTradeStep from './steps/ReadyToTradeStep';
import TutorialFooter from './TutorialFooter';
import ProgressIndicator from './ProgressIndicator';

type PerpsTutorialModalProps = {
  onClose?: () => void;
};

const PerpsTutorialModal: React.FC<PerpsTutorialModalProps> = ({ onClose }) => {
  const isOpen = useSelector(selectTutorialModalOpen);
  const activeStep = useSelector(selectTutorialActiveStep);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  // Use a shorter height for popup to avoid scroll
  const modalHeight = useMemo(() => (isPopup ? '580px' : '675px'), [isPopup]);

  const currentStepIndex = useMemo(
    () => TUTORIAL_STEPS_ORDER.indexOf(activeStep),
    [activeStep],
  );

  const isLastStep = useMemo(
    () => currentStepIndex === TUTORIAL_STEPS_ORDER.length - 1,
    [currentStepIndex],
  );

  const handleClose = useCallback(() => {
    dispatch(setTutorialModalOpen(false));
    dispatch(setTutorialActiveStep(PerpsTutorialStep.WhatArePerps));
    onClose?.();
  }, [dispatch, onClose]);

  const handleContinue = useCallback(() => {
    if (isLastStep) {
      dispatch(markTutorialCompleted());
    } else {
      const nextStep = TUTORIAL_STEPS_ORDER[currentStepIndex + 1];
      dispatch(setTutorialActiveStep(nextStep));
    }
  }, [dispatch, isLastStep, currentStepIndex]);

  const handleSkip = useCallback(() => {
    dispatch(setTutorialModalOpen(false));
  }, [dispatch]);

  const renderContent = useCallback(() => {
    switch (activeStep) {
      case PerpsTutorialStep.WhatArePerps:
        return <WhatArePerpsStep />;
      case PerpsTutorialStep.GoLongOrShort:
        return <GoLongShortStep />;
      case PerpsTutorialStep.ChooseLeverage:
        return <ChooseLeverageStep />;
      case PerpsTutorialStep.WatchLiquidation:
        return <WatchLiquidationStep />;
      case PerpsTutorialStep.CloseAnytime:
        return <CloseAnytimeStep />;
      case PerpsTutorialStep.ReadyToTrade:
        return <ReadyToTradeStep />;
      default:
        return <WhatArePerpsStep />;
    }
  }, [activeStep]);

  return (
    <Modal
      data-testid="perps-tutorial-modal"
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
            height: modalHeight,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <ModalHeader
          data-theme={theme === 'light' ? ThemeType.light : ThemeType.dark}
          data-testid="perps-tutorial-modal-header"
          closeButtonProps={{
            className: 'absolute z-10',
            style: {
              top: '24px',
              right: '12px',
            },
          }}
          paddingBottom={0}
          onClose={handleClose}
        />
        <ModalBody className="w-full h-full pt-6 pb-4 flex flex-col">
          <ProgressIndicator
            totalSteps={TUTORIAL_STEPS_ORDER.length}
            currentStep={currentStepIndex + 1}
          />
          {renderContent()}
          <TutorialFooter
            onContinue={handleContinue}
            onSkip={handleSkip}
            isLastStep={isLastStep}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PerpsTutorialModal;
