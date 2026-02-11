import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  AvatarToken,
  AvatarTokenSize,
} from '../../../components/component-library';

import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import {
  GasFeeContextProvider,
  useGasFeeContext,
} from '../../../contexts/gasFee';
import { ConfirmInfoRow } from '../../../components/app/confirm/info/row';
import GasTiming from '../components/gas-timing/gas-timing.component';
import {
  getAppIsLoading,
  getPreferences,
  selectNetworkConfigurationByChainId,
} from '../../../selectors';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { ConfirmInfoSection } from '../../../components/app/confirm/info/row/section';

type EditGasButtonProps = {
  onClick: () => void;
};

const EditGasButton = ({ onClick }: EditGasButtonProps) => {
  const t = useI18nContext();
  return (
    <ButtonIcon
      size={ButtonIconSize.Sm}
      ariaLabel={t('edit')}
      iconName={IconName.Edit}
      onClick={onClick}
      data-testid="edit-gas-fee-icon"
      className="text-primary-default"
    />
  );
};

type NetworkFeeRowProps = {
  nativeFeeParts: { value: string; suffix?: string };
  fiatFee: string;
  showFiat: boolean;
  onEdit: () => void;
  chainId: string;
};

const NetworkFeeRow = ({
  nativeFeeParts,
  fiatFee,
  showFiat,
  onEdit,
  chainId,
}: NetworkFeeRowProps) => {
  const t = useI18nContext();

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const source =
    CHAIN_ID_TOKEN_IMAGE_MAP[chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP];

  const { nativeCurrency } = networkConfiguration;

  return (
    <ConfirmInfoRow
      label={t('networkFee')}
      tooltip={t('estimatedFeeTooltip')}
      data-testid="edit-gas-fees-row"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        className="flex"
      >
        <EditGasButton onClick={onEdit} />
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="flex"
        >
          {showFiat && fiatFee && (
            <Text className="text-alternative font-medium">{fiatFee}</Text>
          )}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            className="flex"
          >
            <Text className="text-default font-medium">
              {nativeFeeParts.value}
            </Text>
            <AvatarToken
              size={AvatarTokenSize.Xs}
              src={source}
              name={nativeCurrency}
            />
            {nativeCurrency && (
              <Text className="text-default font-medium">{nativeCurrency}</Text>
            )}
          </Box>
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
      <Box alignItems={BoxAlignItems.Center} className="flex">
        <GasTiming
          chainId={chainId}
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      </Box>
    </ConfirmInfoRow>
  );
};

const GasFeesSection = ({ transaction }: { transaction: TransactionMeta }) => {
  const { openModal } =
    useTransactionModalContext() as TransactionModalContextType;

  const { maxFeePerGas, maxPriorityFeePerGas, maximumCostInHexWei } =
    useGasFeeContext() as GasFeeContextType;

  const { chainId } = transaction;

  const { showFiatInTestnets } = useSelector(getPreferences);
  const isTestnet = TEST_CHAINS.includes(
    chainId as (typeof TEST_CHAINS)[number],
  );
  const showFiat = !isTestnet || showFiatInTestnets;

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(
    PRIMARY,
    {
      ethNumberOfDecimals: 6,
      shouldCheckShowNativeToken: true,
      showNativeOverride: true,
    },
    chainId,
  );

  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nativeFee, nativeFeeParts] = useCurrencyDisplay(
    maximumCostInHexWei,
    {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    },
    chainId,
  );

  const [fiatFee] = useCurrencyDisplay(maximumCostInHexWei, {
    numberOfDecimals: secondaryNumberOfDecimals,
    currency: secondaryCurrency,
  });

  return (
    <ConfirmInfoSection data-testid="cancel-speedup-section">
      <NetworkFeeRow
        nativeFeeParts={nativeFeeParts}
        fiatFee={fiatFee}
        showFiat={showFiat}
        onEdit={() => openModal('editGasFee')}
        chainId={transaction.chainId}
      />

      <SpeedRow
        chainId={transaction.chainId}
        maxFeePerGas={maxFeePerGas}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
      />
    </ConfirmInfoSection>
  );
};

const DescriptionSection = ({ isCancel }: { isCancel: boolean }) => {
  const t = useI18nContext();
  return (
    <Box marginTop={4}>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        className="text-center"
      >
        {isCancel
          ? t('cancelTransactionDescription')
          : t('speedUpTransactionDescription')}
      </Text>
    </Box>
  );
};

const ConfirmButton = ({ onClick }: { onClick: () => void }) => {
  const t = useI18nContext();
  return (
    <Button
      variant={ButtonVariant.Primary}
      className="w-full"
      onClick={onClick}
      data-testid="cancel-speedup-confirm-button"
    >
      {t('confirm')}
    </Button>
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
  maximumCostInHexWei: string;
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
  const { currentModal } =
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
          <GasFeesSection transaction={transaction} />
          <DescriptionSection isCancel={isCancel} />
        </Box>
        <ModalFooter>
          <ConfirmButton onClick={handleSubmit} />
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
