import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import React, { useEffect } from 'react';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { bnGreaterThan } from '../../../helpers/utils/util';
import { getAppIsLoading } from '../../../selectors';
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import Spinner from '../../ui/spinner';

// todo: extract to util
const gasUsedGreaterThanEstimate = (transaction, gasFeeEstimates, estimate) => {
  let { maxFeePerGas: maxFeePerGasInTransaction } = transaction.txParams;
  maxFeePerGasInTransaction = new BigNumber(
    hexWEIToDecGWEI(maxFeePerGasInTransaction),
  ).times(1.1);

  const maxFeePerGasFromEstimate =
    gasFeeEstimates[estimate]?.suggestedMaxFeePerGas;
  return bnGreaterThan(maxFeePerGasInTransaction, maxFeePerGasFromEstimate);
};

const CancelSpeedupPopover = () => {
  const {
    editGasMode,
    gasFeeEstimates,
    transaction,
    cancelTransaction,
    speedupTransaction,
    updateTransaction,
    updateTransactionToMinimumGasFee,
    updateTransactionUsingEstimate,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { closeModal, currentModal, openModal } = useTransactionModalContext();
  const appIsLoading = useSelector(getAppIsLoading);

  useEffect(() => {
    if (
      currentModal !== 'cancelSpeedupTransaction' ||
      transaction.previousGas ||
      appIsLoading ||
      !gasFeeEstimates?.high ||
      !gasFeeEstimates?.medium
    )
      return;

    const gasUsedGreaterThanAggressive = gasUsedGreaterThanEstimate(
      transaction,
      gasFeeEstimates,
      PRIORITY_LEVELS.HIGH,
    );
    if (gasUsedGreaterThanAggressive) {
      if (editGasMode === EDIT_GAS_MODES.SPEED_UP) {
        updateTransactionUsingEstimate(PRIORITY_LEVELS.HIGH);
        return;
      }
      updateTransactionToMinimumGasFee();
      return;
    }

    const gasUsedGreaterThanMedium = gasUsedGreaterThanEstimate(
      transaction,
      gasFeeEstimates,
      PRIORITY_LEVELS.MEDIUM,
    );
    if (gasUsedGreaterThanMedium) {
      updateTransactionUsingEstimate(PRIORITY_LEVELS.MINIMUM);
      return;
    }

    updateTransactionUsingEstimate(PRIORITY_LEVELS.MEDIUM);
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
      title={<>{t(EDIT_GAS_MODES.CANCEL ? 'cancel' : 'speedUp')}</>}
      onClose={() => closeModal('cancelSpeedupTransaction')}
      className="cancel-speedup-popover"
    >
      <>
        <div className="cancel-speedup-popover__wrapper">
          {appIsLoading && <Spinner color="#F7C06C" />}
          <Button
            type="primary"
            onClick={() => {
              openModal('editGasFee');
            }}
          >
            act
          </Button>
          <Button type="primary" onClick={submitTransactionChange}>
            Submit
          </Button>
        </div>
      </>
    </Popover>
  );
};

export default CancelSpeedupPopover;
