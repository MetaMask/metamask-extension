import React, { useCallback, useEffect, useState } from 'react';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
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
  selectEnforcedSimulationsDefaultSlippage,
  selectEnforcedSimulationsSlippage,
} from '../../../selectors';
import { ConfirmMetamaskState } from '../../../types/confirm';

export function SimulationSettingsModal({ onClose }: { onClose?: () => void }) {
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
  const [updatedSlippage, setUpdatedSlippage] = useState<number>();

  const handleUpdateSlippage = useCallback(async () => {
    if (updatedSlippage === undefined) {
      return false;
    }

    await setEnforcedSimulationsSlippageForTransaction(
      transactionId,
      updatedSlippage,
    );

    return true;
  }, [transactionId, updatedSlippage]);

  const handleDisable = useCallback(async () => {
    await setEnableEnforcedSimulationsForTransaction(transactionId, false);

    const newContainerTypes = (containerTypes ?? []).filter(
      (type) => type !== TransactionContainerType.EnforcedSimulations,
    );

    await applyTransactionContainersExisting(transactionId, newContainerTypes);
  }, [containerTypes, transactionId]);

  const handleEnable = useCallback(async () => {
    const newContainerTypes = [
      ...(containerTypes ?? []),
      TransactionContainerType.EnforcedSimulations,
    ];

    await applyTransactionContainersExisting(transactionId, newContainerTypes);
    await setEnableEnforcedSimulationsForTransaction(transactionId, true);
  }, [containerTypes, transactionId]);

  const handleUpdateClick = useCallback(async () => {
    const slippageUpdated = await handleUpdateSlippage();

    if (!enabled && isEnforcedSimulationApplied) {
      await handleDisable();
    }

    if (enabled && !isEnforcedSimulationApplied) {
      await handleEnable();
    }

    if (enabled && isEnforcedSimulationApplied && slippageUpdated) {
      await applyTransactionContainersExisting(
        transactionId,
        containerTypes ?? [],
      );
    }

    onClose?.();
  }, [
    containerTypes,
    enabled,
    handleDisable,
    handleEnable,
    handleUpdateSlippage,
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
          <EnforceToggle enabled={enabled} onChange={setEnabled} />
          {enabled && (
            <Slippage
              transactionId={transactionId}
              onChange={setUpdatedSlippage}
            />
          )}
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

function EnforceToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange?: (value: boolean) => void;
}) {
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
}

function Slippage({
  onChange,
  transactionId,
}: {
  onChange?: (slippage: number | undefined) => void;
  transactionId: string;
}) {
  const t = useI18nContext();
  const defaultSlippage = useSelector(selectEnforcedSimulationsDefaultSlippage);

  const savedSlippage = useSelector((state: ConfirmMetamaskState) =>
    selectEnforcedSimulationsSlippage(state, transactionId),
  );

  const [customSlippage, setCustomSlippage] = useState(savedSlippage);

  const [isCustomSlippage, setIsCustomSlippage] = useState(
    savedSlippage !== defaultSlippage,
  );

  const handleCustomSlippageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      const parsedValue = parseInt(value, 10);
      setCustomSlippage(parsedValue);
    },
    [],
  );

  const handleDefaultSlippageClick = useCallback(() => {
    setIsCustomSlippage(false);
  }, []);

  const handleCustomSlippageClick = useCallback(() => {
    setIsCustomSlippage(true);
  }, []);

  const slippage = isCustomSlippage ? customSlippage : defaultSlippage;
  const changeValue = slippage === savedSlippage ? undefined : slippage;

  useEffect(() => {
    onChange?.(changeValue);
  }, [changeValue, onChange]);

  return (
    <Section>
      <Text variant={TextVariant.bodyMdMedium}>
        {t('simulationSettingsModalEnforceSlippage')}
      </Text>
      <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={2}>
        <Pill
          dataTestId="simulation-settings-modal-slippage-default"
          text={`${defaultSlippage}%`}
          isSelected={!isCustomSlippage}
          onClick={handleDefaultSlippageClick}
        />
        <Pill
          dataTestId="simulation-settings-modal-slippage-custom"
          text={t('simulationSettingsModalEnforceSlippageCustom')}
          isSelected={isCustomSlippage}
          onClick={handleCustomSlippageClick}
        />
      </Box>
      {isCustomSlippage && (
        <TextField
          data-testid="simulation-settings-modal-slippage-custom-input"
          type={TextFieldType.Number}
          onChange={handleCustomSlippageChange}
          value={customSlippage}
          endAccessory={'%'}
        />
      )}
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternativeSoft}>
        {t('simulationSettingsModalEnforceSlippageDescription')}
      </Text>
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode | string }) {
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
}

function Pill({
  dataTestId,
  isSelected = false,
  onClick,
  text,
}: {
  dataTestId?: string;
  isSelected?: boolean;
  onClick?: () => void;
  text: string;
}) {
  return (
    <Box
      data-testid={dataTestId}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={
        isSelected
          ? BackgroundColor.primaryMuted
          : BackgroundColor.backgroundAlternative
      }
      borderRadius={BorderRadius.pill}
      borderColor={
        isSelected ? BorderColor.primaryDefault : BorderColor.borderMuted
      }
      paddingInline={5}
      width={BlockSize.Min}
      onClick={onClick}
    >
      <Text
        variant={TextVariant.bodySm}
        color={
          isSelected ? TextColor.primaryDefault : TextColor.textAlternativeSoft
        }
      >
        {text}
      </Text>
    </Box>
  );
}
