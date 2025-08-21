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
  TextField,
  TextFieldType,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import ToggleButton from '../../../../../components/ui/toggle-button';
import { useConfirmContext } from '../../../context/confirm';
import {
  applyTransactionContainersExisting,
  setEnableEnforcedSimulationsForTransaction,
  setEnforcedSimulationsSlippageForTransaction,
} from '../../../../../store/actions';
import {
  selectEnableEnforcedSimulations,
  selectEnforcedSimulationsSlippage,
} from '../../../selectors';
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

const EnforceToggle = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange?: (value: boolean) => void;
}) => {
  const t = useI18nContext();

  return (
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
          onToggle={() => onChange?.(!enabled)}
        />
      </Box>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        {t('simulationSettingsModalEnforceToggleDescription')}
      </Text>
    </Section>
  );
};

const Slippage = ({
  onChange,
  slippage,
}: {
  onChange?: (slippage: number) => void;
  slippage: number;
}) => {
  const t = useI18nContext();

  return (
    <Section>
      <Text variant={TextVariant.bodyMdMedium}>
        {t('simulationSettingsModalEnforceSlippage')}
      </Text>
      <TextField
        data-testid="simulation-settings-modal-slippage-custom-input"
        type={TextFieldType.Number}
        onChange={(e) => onChange?.(Number(e.target.value))}
        value={slippage}
        endAccessory={'%'}
      />
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        {t('simulationSettingsModalEnforceSlippageDescription')}
      </Text>
    </Section>
  );
};

function useSimulationSettings() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { containerTypes, id: transactionId } = currentConfirmation || {};

  const isEnforcedSimulationsEnabled = useSelector(
    (state: ConfirmMetamaskState) =>
      selectEnableEnforcedSimulations(state, transactionId),
  );

  const isEnforcedSimulationApplied = containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  const savedSlippage = useSelector((state: ConfirmMetamaskState) =>
    selectEnforcedSimulationsSlippage(state, transactionId),
  );

  const [enabled, setEnabled] = useState(isEnforcedSimulationsEnabled);
  const [slippage, setSlippage] = useState<number>(savedSlippage);

  const updateSettings = useCallback(async () => {
    const slippageUpdated = slippage !== savedSlippage;
    const isEnabled = enabled && !isEnforcedSimulationApplied;
    const isDisabled = !enabled && isEnforcedSimulationApplied;

    if (slippageUpdated) {
      await setEnforcedSimulationsSlippageForTransaction(
        transactionId,
        slippage,
      );
    }

    const newContainerTypes = [...(containerTypes ?? [])];

    if (isEnabled) {
      newContainerTypes.push(TransactionContainerType.EnforcedSimulations);
    }

    if (isDisabled) {
      newContainerTypes.splice(
        newContainerTypes.indexOf(TransactionContainerType.EnforcedSimulations),
        1,
      );

      await setEnableEnforcedSimulationsForTransaction(transactionId, false);
    }

    if (
      newContainerTypes.length !== containerTypes?.length ||
      slippageUpdated
    ) {
      await applyTransactionContainersExisting(
        transactionId,
        newContainerTypes,
      );
    }

    if (isEnabled) {
      await setEnableEnforcedSimulationsForTransaction(transactionId, true);
    }
  }, [
    containerTypes,
    enabled,
    isEnforcedSimulationApplied,
    savedSlippage,
    slippage,
    transactionId,
  ]);

  return {
    enabled,
    setEnabled,
    slippage,
    setSlippage,
    updateSettings,
  };
}

export const SimulationSettingsModal = ({
  onClose,
}: {
  onClose?: () => void;
}) => {
  const t = useI18nContext();

  const { enabled, setEnabled, slippage, setSlippage, updateSettings } =
    useSimulationSettings();

  const handleUpdateClick = useCallback(async () => {
    await updateSettings();
    onClose?.();
  }, [updateSettings, onClose]);

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
          <EnforceToggle enabled={enabled} onChange={setEnabled} />
          {enabled && <Slippage slippage={slippage} onChange={setSlippage} />}
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
