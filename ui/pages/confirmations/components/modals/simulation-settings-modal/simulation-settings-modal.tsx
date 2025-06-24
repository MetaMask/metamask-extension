import React, { useCallback, useState } from 'react';
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

  const defaultSlippage = useSelector(selectEnforcedSimulationsDefaultSlippage);

  const savedSlippage = useSelector((state: ConfirmMetamaskState) =>
    selectEnforcedSimulationsSlippage(state, transactionId),
  );

  const isEnforcedSimulationApplied = containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  const [enabled, setEnabled] = useState(isEnforcedSimulationsEnabled);
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

  const handleUpdateClick = useCallback(async () => {
    await setEnableEnforcedSimulationsForTransaction(transactionId, enabled);

    let newContainerTypes = containerTypes || [];

    const slippage = isCustomSlippage ? customSlippage : defaultSlippage;

    if (slippage !== savedSlippage) {
      await setEnforcedSimulationsSlippageForTransaction(
        transactionId,
        slippage,
      );
    }

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
    customSlippage,
    defaultSlippage,
    enabled,
    isCustomSlippage,
    isEnforcedSimulationApplied,
    onClose,
    savedSlippage,
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
          <Section>
            <Text variant={TextVariant.bodyMdMedium}>Slippage tolerance</Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
            >
              <Pill
                text={`${defaultSlippage}%`}
                isSelected={!isCustomSlippage}
                onClick={handleDefaultSlippageClick}
              />
              <Pill
                text="Custom"
                isSelected={isCustomSlippage}
                onClick={handleCustomSlippageClick}
              />
              {isCustomSlippage && (
                <TextField
                  type={TextFieldType.Number}
                  onChange={handleCustomSlippageChange}
                  value={customSlippage}
                />
              )}
            </Box>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternativeSoft}
            >
              Set the percentage difference you're comfortable with for the
              displayed balance changes.
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

function Pill({
  isSelected = false,
  onClick,
  text,
}: {
  isSelected?: boolean;
  onClick?: () => void;
  text: string;
}) {
  return (
    <Box
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
