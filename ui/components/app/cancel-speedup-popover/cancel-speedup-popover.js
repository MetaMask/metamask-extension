import { useSelector } from 'react-redux';
import React, { useEffect } from 'react';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { getAppIsLoading } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import Spinner from '../../ui/spinner';

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

    // If gas used previously + 10% was less than medium estimate
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
