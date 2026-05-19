import React from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
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

import { EditGasModes } from '../../../../shared/constants/gas';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import {
  GasFeeModalContextProvider,
  GasFeeModalWrapper,
  useGasFeeModalContext,
} from '../context/gas-fee-modal';
import { ConfirmInfoRow } from '../../../components/app/confirm/info/row';
import GasTiming from '../components/gas-timing/gas-timing.component';
import {
  getAppIsLoading,
  getShouldShowFiat,
  selectNetworkConfigurationByChainId,
} from '../../../selectors';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../shared/constants/network';
import { ConfirmInfoSection } from '../../../components/app/confirm/info/row/section';
import { useEIP1559TxFees } from '../components/confirm/info/hooks/useEIP1559TxFees';
import { useFeeCalculations } from '../components/confirm/info/hooks/useFeeCalculations';
import { useCancelSpeedupGasState } from '../hooks/useCancelSpeedupGasState';
import { useCancelSpeedupInitialGas } from '../hooks/useCancelSpeedupInitialGas';

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
  estimatedFeeNative: string;
  estimatedFeeFiat: string;
  showFiat: boolean;
  onEdit: () => void;
  chainId: string;
};

const NetworkFeeRow = ({
  estimatedFeeNative,
  estimatedFeeFiat,
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

  const { nativeCurrency } = networkConfiguration ?? {};

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
          {showFiat && estimatedFeeFiat && (
            <Text className="text-alternative font-medium">
              {estimatedFeeFiat}
            </Text>
          )}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            className="flex"
          >
            <Text className="text-default font-medium">
              {estimatedFeeNative}
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
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  userFeeLevelOverride?: string;
};

const SpeedRow = ({
  chainId,
  maxFeePerGas,
  maxPriorityFeePerGas,
  userFeeLevelOverride,
}: SpeedRowProps) => {
  const t = useI18nContext();
  return (
    <ConfirmInfoRow label={t('speed')} data-testid="gas-fee-details-speed">
      <Box alignItems={BoxAlignItems.Center} className="flex">
        <GasTiming
          chainId={chainId}
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
          userFeeLevelOverride={userFeeLevelOverride}
        />
      </Box>
    </ConfirmInfoRow>
  );
};

type GasFeesSectionProps = {
  transaction: TransactionMeta;
};

const GasFeesSection = ({ transaction }: GasFeesSectionProps) => {
  const { openGasFeeModal } = useGasFeeModalContext();
  const { chainId } = transaction;

  const showFiat = useSelector((state) => getShouldShowFiat(state, chainId));

  const { maxFeePerGas, maxPriorityFeePerGas } = useEIP1559TxFees(transaction);
  const { estimatedFeeFiat, estimatedFeeNative } =
    useFeeCalculations(transaction);

  return (
    <ConfirmInfoSection data-testid="cancel-speedup-section">
      <NetworkFeeRow
        estimatedFeeNative={estimatedFeeNative}
        estimatedFeeFiat={estimatedFeeFiat}
        showFiat={showFiat}
        onEdit={() => openGasFeeModal()}
        chainId={transaction.chainId}
      />

      <SpeedRow
        chainId={transaction.chainId}
        maxFeePerGas={maxFeePerGas}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
        userFeeLevelOverride={transaction.userFeeLevel}
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

const ConfirmButton = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) => {
  const t = useI18nContext();
  return (
    <Button
      variant={ButtonVariant.Primary}
      className="w-full"
      onClick={onClick}
      disabled={disabled}
      data-testid="cancel-speedup-confirm-button"
    >
      {t('confirm')}
    </Button>
  );
};

type TransactionModalContextType = {
  closeModal: (modalNames: string[]) => void;
  openModal: (modalName: string) => void;
  currentModal: string;
};

type CancelSpeedupModalProps = {
  mode: EditGasModes;
  onClose: () => void;
  dataTestId?: string;
  effectiveTransaction: TransactionMeta;
  cancelTransaction: () => void;
  speedUpTransaction: () => void;
};

const CancelSpeedupModal = ({
  mode,
  onClose,
  dataTestId,
  effectiveTransaction,
  cancelTransaction,
  speedUpTransaction,
}: CancelSpeedupModalProps) => {
  const t = useI18nContext();
  const isCancel = mode === EditGasModes.cancel;

  const handleSubmit = () => {
    if (isCancel) {
      cancelTransaction();
    } else {
      speedUpTransaction();
    }
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid={dataTestId}
      isClosedOnOutsideClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {isCancel
            ? t('cancelTransactionTitle')
            : t('speedUpTransactionTitle')}
        </ModalHeader>
        <Box padding={4}>
          <GasFeesSection transaction={effectiveTransaction} />
          <DescriptionSection isCancel={isCancel} />
        </Box>
        <ModalFooter>
          <ConfirmButton
            onClick={handleSubmit}
            disabled={!effectiveTransaction.previousGas}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

type CancelSpeedupContentProps = {
  transaction: TransactionMeta;
  editGasMode: EditGasModes;
  onClose: () => void;
};

const CancelSpeedupContent = ({
  transaction,
  editGasMode,
  onClose,
}: CancelSpeedupContentProps) => {
  const { currentModal } =
    useTransactionModalContext() as TransactionModalContextType;
  const appIsLoading = useSelector(getAppIsLoading);

  const {
    effectiveTransaction,
    gasFeeEstimates,
    cancelTransaction,
    speedUpTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  } = useCancelSpeedupGasState(transaction, editGasMode);

  useCancelSpeedupInitialGas({
    effectiveTransaction,
    gasFeeEstimates,
    updateTransactionUsingEstimate,
    updateTransactionToTenPercentIncreasedGasFee,
    appIsLoading,
    currentModal,
  });

  return (
    <GasFeeModalContextProvider
      transactionMeta={effectiveTransaction}
      editGasMode={editGasMode}
    >
      <>
        <GasFeeModalWrapper />
        <CancelSpeedupModal
          mode={editGasMode}
          onClose={onClose}
          dataTestId="speed-up-and-cancel-modal"
          effectiveTransaction={effectiveTransaction}
          cancelTransaction={cancelTransaction}
          speedUpTransaction={speedUpTransaction}
        />
      </>
    </GasFeeModalContextProvider>
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
    <CancelSpeedupContent
      transaction={transaction}
      editGasMode={editGasMode}
      onClose={() => closeModal(['cancelSpeedUpTransaction'])}
    />
  );
};
