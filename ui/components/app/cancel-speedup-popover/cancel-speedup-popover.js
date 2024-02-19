import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';
import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getAppIsLoading } from '../../../selectors';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import GasDetailsItem from '../../../pages/confirmations/components/gas-details-item';
import Box from '../../ui/box';
import InfoTooltip from '../../ui/info-tooltip';
import AppLoadingSpinner from '../app-loading-spinner';
import {
  Text,
  Button,
  ButtonLink,
  Modal,
  ModalOverlay,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header/deprecated';

const CancelSpeedupPopover = () => {
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
          {editGasMode === EditGasModes.cancel
            ? `❌${t('cancel')}`
            : `🚀${t('speedUp')}`}
        </ModalHeader>

        <AppLoadingSpinner className="cancel-speedup-popover__spinner" />
        <div className="cancel-speedup-popover__wrapper">
          <Text
            alignItems={AlignItems.center}
            display={Display.Flex}
            variant={TextVariant.bodySm}
            marginBottom={2}
            paddingBottom={2}
            className="cancel-speedup-popover__description"
          >
            {t('cancelSpeedUpLabel', [
              <strong key="cancelSpeedupReplace">{t('replace')}</strong>,
            ])}
            <InfoTooltip
              position="top"
              contentText={
                <>
                  <Text variant={TextVariant.bodySm}>
                    {t('cancelSpeedUpTransactionTooltip', [
                      editGasMode === EditGasModes.cancel
                        ? t('cancel')
                        : t('speedUp'),
                    ])}
                  </Text>
                  <ButtonLink
                    variant={TextVariant.bodySm}
                    href="https://community.metamask.io/t/how-to-speed-up-or-cancel-transactions-on-metamask/3296"
                    target="_blank"
                  >
                    {t('learnMoreUpperCase')}
                  </ButtonLink>
                </>
              }
            />
          </Text>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            flexDirection={FlexDirection.Column}
            marginTop={2}
          >
            <div className="cancel-speedup-popover__gas-details">
              <GasDetailsItem />
            </div>
          </Box>
          <Button onClick={submitTransactionChange}>{t('submit')}</Button>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default CancelSpeedupPopover;
