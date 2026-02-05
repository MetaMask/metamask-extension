import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextButton,
  TextVariant,
} from '@metamask/design-system-react';
import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import { getAppIsLoading } from '../../../selectors';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import {
  GasFeeContextProvider,
  useGasFeeContext,
} from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import GasDetailsItem from '../../../pages/confirmations/components/gas-details-item';
import InfoTooltip from '../../ui/info-tooltip';
import AppLoadingSpinner from '../app-loading-spinner';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '../../component-library';

const CancelSpeedupPopoverWrapped = () => {
  const {
    cancelTransaction,
    editGasMode,
    gasFeeEstimates,
    speedUpTransaction,
    transaction,
    updateTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, currentModal } = useTransactionModalContext();
  const appIsLoading = useSelector(getAppIsLoading);

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

  if (currentModal !== 'cancelSpeedUpTransaction') {
    return null;
  }

  const submitTransactionChange = () => {
    if (editGasMode === EditGasModes.cancel) {
      cancelTransaction();
    } else {
      speedUpTransaction();
    }
    closeModal(['cancelSpeedUpTransaction']);
  };

  return (
    <Modal
      isOpen
      onClose={() => closeModal(['cancelSpeedUpTransaction'])}
      className="cancel-speedup-popover"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => closeModal(['cancelSpeedUpTransaction'])}
          marginBottom={4}
        >
          {editGasMode === EditGasModes.cancel ? t('cancel') : t('speedUp')}
        </ModalHeader>

        <AppLoadingSpinner className="cancel-speedup-popover__spinner" />
        <div className="cancel-speedup-popover__wrapper">
          <Text
            className="cancel-speedup-popover__description flex items-center mb-2 pb-2"
            variant={TextVariant.BodySm}
          >
            {t('cancelSpeedUpLabel', [t('replace')])}
            <InfoTooltip
              position="top"
              contentText={
                <>
                  <Text variant={TextVariant.BodySm}>
                    {t('cancelSpeedUpTransactionTooltip', [
                      editGasMode === EditGasModes.cancel
                        ? t('cancel')
                        : t('speedUp'),
                    ])}
                  </Text>
                  <TextButton asChild className="inline">
                    <a
                      href="https://community.metamask.io/t/how-to-speed-up-or-cancel-transactions-on-metamask/3296"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('learnMoreUpperCase')}
                    </a>
                  </TextButton>
                </>
              }
            />
          </Text>
          <Box
            alignItems={BoxAlignItems.Center}
            flexDirection={BoxFlexDirection.Column}
            className="mt-2"
          >
            <div className="cancel-speedup-popover__gas-details">
              <GasDetailsItem />
            </div>
          </Box>
        </div>
        <ModalFooter
          onSubmit={submitTransactionChange}
          submitButtonProps={{ children: t('submit') }}
        />
      </ModalContent>
    </Modal>
  );
};

const CancelSpeedupPopover = ({ transaction, editGasMode }) => {
  const { currentModal } = useTransactionModalContext();

  if (currentModal !== 'cancelSpeedUpTransaction') {
    return null;
  }

  return (
    <GasFeeContextProvider transaction={transaction} editGasMode={editGasMode}>
      <CancelSpeedupPopoverWrapped />
    </GasFeeContextProvider>
  );
};

CancelSpeedupPopover.propTypes = {
  transaction: PropTypes.object.isRequired,
  editGasMode: PropTypes.string,
};

export default CancelSpeedupPopover;
