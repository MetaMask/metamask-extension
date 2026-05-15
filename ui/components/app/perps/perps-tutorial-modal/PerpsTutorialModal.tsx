import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
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
  setTutorialActiveStep,
  markTutorialCompleted,
  PerpsTutorialStep,
  TUTORIAL_STEPS_ORDER,
} from '../../../../ducks/perps';
import { useTheme } from '../../../../hooks/useTheme';
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { submitRequestToBackground } from '../../../../store/background-connection';
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
  const { track } = usePerpsEventTracking();
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.TUTORIAL,
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
    },
  });
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsUiInteraction,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.TUTORIAL_STARTED,
    },
  });
  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
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
    dispatch(markTutorialCompleted());
    submitRequestToBackground('perpsMarkTutorialCompleted', []);
    onClose?.();
  }, [dispatch, onClose]);

  const handleContinue = useCallback(() => {
    if (isLastStep) {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.TUTORIAL_COMPLETED,
      });
      dispatch(markTutorialCompleted());
      submitRequestToBackground('perpsMarkTutorialCompleted', []);
    } else {
      const nextStep = TUTORIAL_STEPS_ORDER[currentStepIndex + 1];
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.TUTORIAL_NAVIGATION,
        [PERPS_EVENT_PROPERTY.PREVIOUS_SCREEN]: activeStep,
        [PERPS_EVENT_PROPERTY.CURRENT_SCREEN]: nextStep,
      });
      dispatch(setTutorialActiveStep(nextStep));
    }
  }, [dispatch, isLastStep, currentStepIndex, activeStep, track]);

  const handleSkip = useCallback(() => {
    dispatch(markTutorialCompleted());
    submitRequestToBackground('perpsMarkTutorialCompleted', []);
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
