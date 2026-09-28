import React, { type ReactNode } from 'react';
import { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { GAS_INPUT_HELP_TEXT_ID, GasInput } from '../../gas-input/gas-input';

type AdvancedGasFeeModalProps = {
  children: ReactNode;
  gasLimit: Hex | undefined;
  handleCloseModals: () => void;
  hasError: boolean;
  isGasEstimationFailed: boolean;
  isGasLimitAvailable: boolean;
  isGasLimitEditable: boolean;
  modalTestId: string;
  onGasLimitChange: (gasLimit: Hex) => void;
  onGasLimitErrorChange: (error: string | undefined) => void;
  onNavigateToEstimates: () => void;
  onSave: () => void;
  title: string;
};

export const AdvancedGasFeeModal = ({
  children,
  gasLimit,
  handleCloseModals,
  hasError,
  isGasEstimationFailed,
  isGasLimitAvailable,
  isGasLimitEditable,
  modalTestId,
  onGasLimitChange,
  onGasLimitErrorChange,
  onNavigateToEstimates,
  onSave,
  title,
}: AdvancedGasFeeModalProps) => {
  const t = useI18nContext();
  let gasLimitHelpText: string | undefined;
  if (!isGasLimitAvailable) {
    gasLimitHelpText = isGasEstimationFailed
      ? t('alertMessageGasEstimateFailed')
      : t('gasLimitEditingUnavailable');
  }

  return (
    <Modal isOpen={true} onClose={handleCloseModals}>
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Md} data-testid={modalTestId}>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          {children}
          <Box marginBottom={4} />
          <GasInput
            gasLimit={gasLimit}
            helpText={gasLimitHelpText}
            isDisabled={!isGasLimitEditable}
            onChange={onGasLimitChange}
            onErrorChange={onGasLimitErrorChange}
          />
        </ModalBody>
        <ModalFooter>
          <Box
            alignItems={BoxAlignItems.Stretch}
            flexDirection={BoxFlexDirection.Row}
            gap={4}
          >
            <Button
              data-testid="gas-fee-modal-cancel-button"
              style={{ flex: 1 }}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Secondary}
              onClick={onNavigateToEstimates}
            >
              {t('cancel')}
            </Button>
            <Button
              aria-describedby={
                isGasLimitAvailable ? undefined : GAS_INPUT_HELP_TEXT_ID
              }
              data-testid="gas-fee-modal-save-button"
              style={{ flex: 1 }}
              size={ButtonSize.Lg}
              isDisabled={hasError || !isGasLimitAvailable}
              onClick={onSave}
            >
              {t('save')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
