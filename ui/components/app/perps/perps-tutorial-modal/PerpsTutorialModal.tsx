import React, { useCallback, useMemo } from 'react';
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
  selectTutorialModalOpen,
  selectTutorialActiveStep,
  setTutorialModalOpen,
  setTutorialActiveStep,
  PerpsTutorialStep,
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

  const handleClose = useCallback(() => {
    dispatch(setTutorialModalOpen(false));
    dispatch(setTutorialActiveStep(PerpsTutorialStep.WhatArePerps));
    onClose?.();
  }, [dispatch, onClose]);

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
        {renderContent()}
      </ModalContent>
    </Modal>
  );
};

export default PerpsTutorialModal;
