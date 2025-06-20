import React, { useCallback, useState } from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  ButtonPrimary,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import ToggleButton from '../../../../../components/ui/toggle-button';
import { useConfirmContext } from '../../../context/confirm';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  enforceSimulationsForTransaction,
  setEnableEnforcedSimulationsForTransaction,
  updateEditableParams,
} from '../../../../../store/actions';
import { useDispatch, useSelector } from 'react-redux';
import { selectEnableEnforcedSimulations } from '../../../selectors';
import { ConfirmMetamaskState } from '../../../types/confirm';

export function SimulationSettingsModal({ onClose }: { onClose?: () => void }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const {
    containerTypes,
    id: transactionId,
    txParamsOriginal,
  } = currentConfirmation || {};

  const isEnforcedSimulationsEnabled = useSelector(
    (state: ConfirmMetamaskState) =>
      selectEnableEnforcedSimulations(state, transactionId),
  );

  const isEnforcedSimulationApplied = containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  const [enabled, setEnabled] = useState(isEnforcedSimulationsEnabled);

  const handleUpdateClick = useCallback(async () => {
    await setEnableEnforcedSimulationsForTransaction(transactionId, enabled);

    if (!enabled && isEnforcedSimulationApplied) {
      const newContainerTypes = containerTypes?.filter(
        (type) => type !== TransactionContainerType.EnforcedSimulations,
      );

      await dispatch(
        updateEditableParams(transactionId, {
          containerTypes: newContainerTypes,
          data: txParamsOriginal?.data,
          gas: txParamsOriginal?.gas,
          to: txParamsOriginal?.to,
          value: txParamsOriginal?.value,
        }),
      );
    }

    if (enabled && !isEnforcedSimulationApplied) {
      await enforceSimulationsForTransaction(transactionId);
    }

    onClose?.();
  }, [
    dispatch,
    enabled,
    isEnforcedSimulationApplied,
    transactionId,
    txParamsOriginal,
  ]);

  return (
    <Modal
      isOpen={true}
      onClose={
        onClose ??
        (() => {
          // Intentionally empty
        })
      }
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>Simulation settings</ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            style={{ marginRight: '-12px' }}
          >
            <Text variant={TextVariant.bodyMd}>Enforced simulations</Text>
            <ToggleButton
              dataTestId="simulation-settings-modal-enable-enforced"
              value={enabled}
              onToggle={() => setEnabled(!enabled)}
            />
          </Box>
          <ButtonPrimary
            onClick={handleUpdateClick}
            data-testid="simulation-settings-modal-update"
          >
            {t('update')}
          </ButtonPrimary>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
