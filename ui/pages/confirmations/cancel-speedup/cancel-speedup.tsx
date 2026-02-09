import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  IconName,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '../../../components/component-library';
import {
  IconColor,
  TextVariant,
  TextColor,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextAlign,
} from '../../../helpers/constants/design-system';

import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import {
  GasFeeContextProvider,
  useGasFeeContext,
} from '../../../contexts/gasFee';
import { ConfirmInfoRow } from '../../../components/app/confirm/info/row';
import GasTiming from '../components/gas-timing/gas-timing.component';
import { getAppIsLoading, getPreferences } from '../../../selectors';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { ConfirmInfoSection } from '../../../components/app/confirm/info/row/section';

type EditGasButtonProps = {
  onClick: () => void;
};

const EditGasButton = ({ onClick }: EditGasButtonProps) => {
  return (
    <Button
      size={ButtonSize.Auto}
      variant={ButtonVariant.Link}
      startIconName={IconName.Edit}
      color={IconColor.primaryDefault}
      onClick={onClick}
      data-testid="edit-gas-fee-icon"
    />
  );
};

type NetworkFeeRowProps = {
  nativeFee: string;
  fiatFee: string;
  showFiat: boolean;
  onEdit: () => void;
};

const NetworkFeeRow = ({
  nativeFee,
  fiatFee,
  showFiat,
  onEdit,
}: NetworkFeeRowProps) => {
  const t = useI18nContext();
  return (
    <ConfirmInfoRow
      label={t('networkFee')}
      tooltip={t('estimatedFeeTooltip')}
      data-testid="edit-gas-fees-row"
    >
      <Box
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        className="flex"
      >
        <EditGasButton onClick={onEdit} />
        <Box
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
          className="flex"
        >
          <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
            {nativeFee}
          </Text>
          {showFiat && (
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {fiatFee}
            </Text>
          )}
        </Box>
      </Box>
    </ConfirmInfoRow>
  );
};

type SpeedRowProps = {
  chainId: string;
  maxFeePerGas: string | undefined;
  maxPriorityFeePerGas: string | undefined;
};

const SpeedRow = ({
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: SpeedRowProps) => {
  const t = useI18nContext();
  return (
    <ConfirmInfoRow label={t('speed')} data-testid="gas-fee-details-speed">
      <Box alignItems={AlignItems.center} className="flex">
        <GasTiming
          chainId={chainId}
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      </Box>
    </ConfirmInfoRow>
  );
};

type CancelSpeedupModalProps = {
  mode: EditGasModes;
  onClose: () => void;
  dataTestId?: string;
};

type UpdateTransactionArgs = {
  estimateUsed?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimateSuggested?: string;
};

// Define types for contexts since they are not fully typed in their source files
type GasFeeContextType = {
  cancelTransaction: () => void;
  editGasMode: EditGasModes;
  gasFeeEstimates: GasFeeEstimates;
  speedUpTransaction: () => void;
  transaction: TransactionMeta;
  updateTransaction: (update: UpdateTransactionArgs) => void;
  updateTransactionToTenPercentIncreasedGasFee: (arg: boolean) => void;
  updateTransactionUsingEstimate: (level: string) => void;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  minimumCostInHexWei: string;
};

type TransactionModalContextType = {
  closeModal: (modalNames: string[]) => void;
  openModal: (modalName: string) => void;
  currentModal: string;
};

const CancelSpeedupModal = ({
  mode,
  onClose,
  dataTestId,
}: CancelSpeedupModalProps) => {
  const t = useI18nContext();
  const { openModal, currentModal } =
    useTransactionModalContext() as TransactionModalContextType;
  const appIsLoading = useSelector(getAppIsLoading);

  const {
    cancelTransaction,
    editGasMode,
    gasFeeEstimates,
    speedUpTransaction,
    transaction,
    updateTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas,
    minimumCostInHexWei,
  } = useGasFeeContext() as GasFeeContextType;

  const isCancel = mode === EditGasModes.cancel;

  useEffect(() => {
    if (
      transaction.previousGas ||
      appIsLoading ||
      currentModal !== 'cancelSpeedUpTransaction'
    ) {
      return;
    }
    // If gas used previously + 10% is less than medium estimated gas
    // estimate is set to medium, else estimate is set to tenPercentIncreased
    const gasUsedLessThanMedium =
      gasFeeEstimates &&
      gasEstimateGreaterThanGasUsedPlusTenPercent(
        transaction.txParams,
        gasFeeEstimates,
        PriorityLevels.medium,
      );
    if (gasUsedLessThanMedium) {
      updateTransactionUsingEstimate(PriorityLevels.medium);
      return;
    }
    updateTransactionToTenPercentIncreasedGasFee(true);
  }, [
    appIsLoading,
    currentModal,
    editGasMode,
    gasFeeEstimates,
    transaction,
    updateTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  ]);

  const handleSubmit = () => {
    if (isCancel) {
      cancelTransaction();
    } else {
      speedUpTransaction();
    }
    onClose();
  };

  const { showFiatInTestnets } = useSelector(getPreferences);
  const isTestnet = TEST_CHAINS.includes(
    transaction?.chainId as (typeof TEST_CHAINS)[number],
  );
  const showFiat = !isTestnet || showFiatInTestnets;

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY);
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY);

  const [nativeFee] = useCurrencyDisplay(minimumCostInHexWei, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  const [fiatFee] = useCurrencyDisplay(minimumCostInHexWei, {
    numberOfDecimals: secondaryNumberOfDecimals,
    currency: secondaryCurrency,
  });

  return (
    <Modal isOpen onClose={onClose} data-testid={dataTestId}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {isCancel
            ? t('cancelTransactionTitle')
            : t('speedUpTransactionTitle')}
        </ModalHeader>
        <Box padding={4}>
          <ConfirmInfoSection data-testid="cancel-speedup-section">
            <NetworkFeeRow
              nativeFee={nativeFee}
              fiatFee={fiatFee}
              showFiat={showFiat}
              onEdit={() => openModal('editGasFee')}
            />

            <SpeedRow
              chainId={transaction.chainId}
              maxFeePerGas={maxFeePerGas}
              maxPriorityFeePerGas={maxPriorityFeePerGas}
            />
          </ConfirmInfoSection>
          <Box marginTop={4}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              textAlign={TextAlign.Center}
            >
              {isCancel
                ? t('cancelTransactionDescription')
                : t('speedUpTransactionDescription')}
            </Text>
          </Box>
        </Box>
        <ModalFooter>
          <Button
            variant={ButtonVariant.Primary}
            className="w-full"
            onClick={handleSubmit}
            data-testid="cancel-speedup-confirm-button"
          >
            {t('confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

type CancelSpeedupProps = {
  transaction: TransactionMeta;
  editGasMode: EditGasModes;
};

export const CancelSpeedup = ({
  transaction,
  editGasMode,
}: CancelSpeedupProps) => {
  const { currentModal, closeModal } =
    useTransactionModalContext() as TransactionModalContextType;

  if (currentModal !== 'cancelSpeedUpTransaction') {
    return null;
  }

  return (
    <GasFeeContextProvider transaction={transaction} editGasMode={editGasMode}>
      <CancelSpeedupModal
        mode={editGasMode}
        onClose={() => closeModal(['cancelSpeedUpTransaction'])}
      />
    </GasFeeContextProvider>
  );
};
