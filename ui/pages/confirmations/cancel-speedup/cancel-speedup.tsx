import React, { ReactNode, useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  TextVariant,
  TextAlign,
  TextColor,
} from '@metamask/design-system-react';

import {
  GasRecommendations,
  EditGasModes,
} from '../../../../shared/constants/gas';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import { useGasFeeInputs } from '../hooks/useGasFeeInputs';
import { ConfirmContext } from '../context/confirm';
import { GasFeeModalContextProvider } from '../context/gas-fee-modal';
import { GasFeesSection } from '../components/confirm/info/shared/gas-fees-section/gas-fees-section';
import { DappSwapContextProvider } from '../context/dapp-swap';
import { ConfirmAlerts } from '../components/confirm/confirm-alerts';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { useSelector } from 'react-redux';
import { selectTransactionMetadata } from '../../../selectors';

interface CancelSpeedupModalProps {
  transaction: TransactionMeta;
  mode: EditGasModes;
  onClose: () => void;
  dataTestId?: string;
}

const CancelSpeedupModal = ({
  transaction,
  mode,
  onClose,
  dataTestId,
}: CancelSpeedupModalProps) => {
  const t = useI18nContext();

  const transactionMeta = useSelector((state) => selectTransactionMetadata(state, transaction.id));


  const {
    transaction: draftTransaction,
    cancelTransaction,
    speedUpTransaction,
  } = useGasFeeInputs(GasRecommendations.medium, transactionMeta, undefined, mode);

  const isCancel = mode === EditGasModes.cancel;

  const handleSubmit = () => {
    if (isCancel) {
      cancelTransaction();
    } else {
      speedUpTransaction();
    }
    onClose();
  };
  console.log('CancelSpeedupModal transactionMeta >>>>>', { transactionMeta, draftTransaction });
  const confirmContextValue = useMemo(
    () => ({
      currentConfirmation: draftTransaction as TransactionMeta,
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: () => undefined,
      disableGasEdit: true,
    }),
    [draftTransaction],
  );

  return (
    <Modal isOpen onClose={onClose} data-testid={dataTestId}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {isCancel ? t('cancelTransactionTitle') : t('speedUpTransactionTitle')}
        </ModalHeader>
        <Box padding={4}>
          <ConfirmContext.Provider value={confirmContextValue}>
            <DappSwapContextProvider>
              <GasFeeContextProvider transaction={draftTransaction as TransactionMeta}>
                <GasFeeModalContextProvider>
              <ConfirmAlerts>
                  <GasFeesSection />
              </ConfirmAlerts>
                </GasFeeModalContextProvider>
              </GasFeeContextProvider>
            </DappSwapContextProvider>
          </ConfirmContext.Provider>
          <Box marginTop={4}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
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

interface CancelSpeedupProps {
  transaction: TransactionMeta;
  editGasMode: EditGasModes;
}

export const CancelSpeedup = ({
  transaction,
  editGasMode,
}: CancelSpeedupProps) => {
  const { currentModal, closeModal } = useTransactionModalContext() as any;

  console.log('CancelSpeedup render', { currentModal, editGasMode });

  if (currentModal !== 'cancelSpeedUpTransaction') {
    return null;
  }

  console.log('CancelSpeedup rendered modal >>>>>>>>');

  return (
    <CancelSpeedupModal
      transaction={transaction}
      mode={editGasMode}
      onClose={() => closeModal(['cancelSpeedUpTransaction'])}
    />
  );
};
