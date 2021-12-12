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
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { getAppIsLoading } from '../../../selectors';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Box from '../../ui/box';
import Button from '../../ui/button';
import I18nValue from '../../ui/i18n-value';
import InfoTooltip from '../../ui/info-tooltip';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography';
import AppLoadingSpinner from '../app-loading-spinner';
import GasTiming from '../gas-timing';

const CancelSpeedupPopover = () => {
  const {
    cancelTransaction,
    editGasMode,
    estimatedMaximumFiat,
    estimatedMaximumNative,
    estimatedMinimumFiat,
    estimatedMinimumNative,
    gasFeeEstimates,
    maxFeePerGas,
    maxPriorityFeePerGas,
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
    const gasUsedGreaterThanMedium = gasEstimateGreaterThanGasUsedPlusTenPercent(
      transaction,
      gasFeeEstimates,
      PRIORITY_LEVELS.MEDIUM,
    );
    if (gasUsedGreaterThanMedium) {
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

  // if (currentModal !== 'cancelSpeedupTransaction') return null;

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
      <AppLoadingSpinner />
      <div className="cancel-speedup-popover__wrapper">
        <Typography
          boxProps={{ alignItems: ALIGN_ITEMS.CENTER, display: DISPLAY.FLEX }}
          variant={TYPOGRAPHY.H6}
        >
          <I18nValue
            messageKey="cancelSpeedUpLabel"
            options={[
              <strong key="cancelSpeedupReplace">
                <I18nValue messageKey="replace" />
              </strong>,
            ]}
          />
          <InfoTooltip position="top" />
        </Typography>
        <Box
          className="cancel-speedup-popover__transaction-info"
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
            className="cancel-speedup-popover__transaction-info__row"
          >
            <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
              <strong>
                <I18nValue messageKey="gas" />
              </strong>
              <InfoTooltip position="top" />
            </Box>
            <Box>
              <button
                className="cancel-speedup-popover__transaction-info__edit-btn"
                onClick={() => {
                  openModal('editGasFee');
                }}
                type="link"
              >
                <img src="images/edit.svg" alt="" />
              </button>
              <span className="cancel-speedup-popover__transaction-info__maxfee">
                {estimatedMinimumNative}
              </span>
              <strong className="cancel-speedup-popover__transaction-info__maxfee">
                {estimatedMinimumFiat || estimatedMinimumNative}
              </strong>
            </Box>
          </Box>
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
            className="cancel-speedup-popover__transaction-info__row"
          >
            <span className="cancel-speedup-popover__transaction-info__duration">
              {/* todo: gas timing component changes */}
              <GasTiming
                maxPriorityFeePerGas={maxPriorityFeePerGas}
                maxFeePerGas={maxFeePerGas}
              />
            </span>
            <span className="cancel-speedup-popover__transaction-info__totalfee">
              <span>
                <I18nValue messageKey="maxFee" />
              </span>
              <span className="cancel-speedup-popover__transaction-info__totalfee__value">
                {estimatedMaximumFiat || estimatedMaximumNative}
              </span>
            </span>
          </Box>
        </Box>
        <Button type="primary" onClick={submitTransactionChange}>
          Submit
        </Button>
      </div>
    </Popover>
  );
};

export default CancelSpeedupPopover;
