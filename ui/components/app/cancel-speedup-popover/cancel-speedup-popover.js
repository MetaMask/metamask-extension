import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';

import { EditGasModes, PriorityLevels } from '../../../../shared/constants/gas';
import {
  ALIGN_ITEMS,
  DISPLAY,
  FLEX_DIRECTION,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { getAppIsLoading } from '../../../selectors';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import EditGasFeeButton from '../edit-gas-fee-button';
import GasDetailsItem from '../gas-details-item';
import Box from '../../ui/box';
import Button from '../../ui/button';
import InfoTooltip from '../../ui/info-tooltip';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography';
import AppLoadingSpinner from '../app-loading-spinner';

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
    <Popover
      title={
        <>
          {editGasMode === EditGasModes.cancel
            ? `❌${t('cancel')}`
            : `🚀${t('speedUp')}`}
        </>
      }
      onClose={() => closeModal(['cancelSpeedUpTransaction'])}
      className="cancel-speedup-popover"
    >
      <AppLoadingSpinner className="cancel-speedup-popover__spinner" />
      <div className="cancel-speedup-popover__wrapper">
        <Typography
          boxProps={{ alignItems: ALIGN_ITEMS.CENTER, display: DISPLAY.FLEX }}
          variant={TYPOGRAPHY.H6}
          marginTop={0}
          marginBottom={2}
        >
          {t('cancelSpeedUpLabel', [
            <strong key="cancelSpeedupReplace">{t('replace')}</strong>,
          ])}
          <InfoTooltip
            position="top"
            contentText={
              <Box>
                {t('cancelSpeedUpTransactionTooltip', [
                  editGasMode === EditGasModes.cancel
                    ? t('cancel')
                    : t('speedUp'),
                ])}
                <div>
                  <a
                    href="https://community.metamask.io/t/how-to-speed-up-or-cancel-transactions-on-metamask/3296"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('learnMoreUpperCase')}
                  </a>
                </div>
              </Box>
            }
          />
        </Typography>
        <div className="cancel-speedup-popover__separator" />
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
          marginTop={4}
        >
          <Box className="cancel-speedup-popover__edit-gas-button">
            {!appIsLoading && <EditGasFeeButton />}
          </Box>
          <Box className="cancel-speedup-popover__gas-details">
            <GasDetailsItem />
          </Box>
        </Box>
        <Button type="primary" onClick={submitTransactionChange}>
          {t('submit')}
        </Button>
      </div>
    </Popover>
  );
};

export default CancelSpeedupPopover;
