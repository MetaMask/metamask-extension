import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
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
import GasDetailsItem from '../gas-details-item';
import EditGasFeeButton from '../edit-gas-fee-button';
import Box from '../../ui/box';
import Button from '../../ui/button';
import I18nValue from '../../ui/i18n-value';
import InfoTooltip from '../../ui/info-tooltip';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography';
import AppLoadingSpinner from '../app-loading-spinner';

const CancelSpeedupPopover = () => {
  const {
    cancelTransaction,
    editGasMode,
    gasFeeEstimates,
    speedupTransaction,
    transaction,
    updateTransaction,
    updateTransactionToMinimumGasFee,
    updateTransactionUsingEstimate,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, currentModal, openModal } = useTransactionModalContext();
  const appIsLoading = useSelector(getAppIsLoading);

  useEffect(() => {
    if (
      transaction.previousGas ||
      appIsLoading ||
      !gasFeeEstimates?.high ||
      !gasFeeEstimates?.medium
    ) {
      return;
    }

    // If gas used previously + 10% was less than
    // estimate is set to medium, else minimum
    const gasUsedLessThanMedium = gasEstimateGreaterThanGasUsedPlusTenPercent(
      transaction,
      gasFeeEstimates,
      PRIORITY_LEVELS.MEDIUM,
    );
    if (gasUsedLessThanMedium) {
      updateTransactionUsingEstimate(PRIORITY_LEVELS.MEDIUM);
      return;
    }
    updateTransactionUsingEstimate(PRIORITY_LEVELS.MINIMUM);
  }, [
    appIsLoading,
    currentModal,
    editGasMode,
    gasFeeEstimates,
    transaction,
    updateTransaction,
    updateTransactionToMinimumGasFee,
    updateTransactionUsingEstimate,
  ]);

  if (currentModal !== 'cancelSpeedupTransaction') return null;

  const submitTransactionChange = () => {
    if (editGasMode === EDIT_GAS_MODES.CANCEL) {
      cancelTransaction();
      return;
    }
    speedupTransaction();
  };

  return (
    <Popover
      title={
        <>
          {editGasMode === EDIT_GAS_MODES.CANCEL
            ? `❌${t('cancel')}`
            : `🚀${t('speedUp')}`}
        </>
      }
      onClose={() => closeModal('cancelSpeedupTransaction')}
      className="cancel-speedup-popover"
    >
      <AppLoadingSpinner className="cancel-speedup-popover__spinner" />
      <div className="cancel-speedup-popover__wrapper">
        <Typography
          boxProps={{ alignItems: ALIGN_ITEMS.CENTER, display: DISPLAY.FLEX }}
          variant={TYPOGRAPHY.H6}
          margin={[0, 0, 4, 0]}
        >
          <I18nValue
            messageKey="cancelSpeedUpLabel"
            options={[
              <strong key="cancelSpeedupReplace">
                <I18nValue messageKey="replace" />
              </strong>,
            ]}
          />
          <InfoTooltip
            position="top"
            contentText="To cancel a transaction the gas fee must be increased by at least 10% for it to be recognized by the network."
          />
        </Typography>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <EditGasFeeButton />
          <GasDetailsItem />
        </Box>
        <Button type="primary" onClick={submitTransactionChange}>
          Submit
        </Button>
      </div>
    </Popover>
  );
};

export default CancelSpeedupPopover;
