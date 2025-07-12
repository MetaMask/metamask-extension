import React, { useCallback, useState } from 'react';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
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
  applyTransactionContainersExisting,
  setEnableEnforcedSimulationsForTransaction,
} from '../../../../../store/actions';
import { selectEnableEnforcedSimulations } from '../../../selectors';
import { ConfirmMetamaskState } from '../../../types/confirm';

const Section = ({ children }: { children: React.ReactNode | string }) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.MD}
      padding={2}
      gap={2}
    >
      {children}
    </Box>
  );
};

export const SimulationSettingsModal = ({
  onClose,
}: {
  onClose?: () => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { containerTypes, id: transactionId } = currentConfirmation || {};

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

    let newContainerTypes = containerTypes || [];

    if (!enabled && isEnforcedSimulationApplied) {
      newContainerTypes = newContainerTypes.filter(
        (type) => type !== TransactionContainerType.EnforcedSimulations,
      );
    }

    if (enabled && !isEnforcedSimulationApplied) {
      newContainerTypes = [
        ...newContainerTypes,
        TransactionContainerType.EnforcedSimulations,
      ];
    }

    if (newContainerTypes.length !== containerTypes?.length) {
      await applyTransactionContainersExisting(
        transactionId,
        newContainerTypes,
      );
    }

    onClose?.();
  }, [
    containerTypes,
    enabled,
    isEnforcedSimulationApplied,
    onClose,
    transactionId,
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
        <ModalHeader onClose={onClose}>
          {t('simulationSettingsModalTitle')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Section>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              style={{ marginRight: '-12px' }}
            >
              <Text variant={TextVariant.bodyMdMedium}>
                {t('simulationSettingsModalEnforceToggle')}
              </Text>
              <ToggleButton
                dataTestId="simulation-settings-modal-enable-enforced"
                value={enabled}
                onToggle={() => setEnabled(!enabled)}
              />
            </Box>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternativeSoft}
            >
              {t('simulationSettingsModalEnforceToggleDescription')}
            </Text>
          </Section>
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
};
