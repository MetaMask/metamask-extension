import React, { useEffect } from 'react';
import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';

import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import { getAppIsLoading } from '../../../selectors';
import { bnGreaterThan } from '../../../helpers/utils/util';
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import Spinner from '../../ui/spinner';

const CancelSpeedupPopover = () => {
  const {
    editGasMode,
    gasFeeEstimates,
    transaction,
    updateTransaction,
    updateTransactionUsingEstimate,
  } = useGasFeeContext();
  const t = useI18nContext();
  const { openModal, closeModal, currentModal } = useTransactionModalContext();
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

    let { maxFeePerGas: maxFeePerGasInTransaction } = transaction.txParams;
    maxFeePerGasInTransaction = new BigNumber(
      hexWEIToDecGWEI(maxFeePerGasInTransaction),
    ).times(1.1);

    const maxFeePerGasAggressive = gasFeeEstimates.high?.suggestedMaxFeePerGas;
    const gasUsedGreaterThanAggressive = bnGreaterThan(
      maxFeePerGasInTransaction,
      maxFeePerGasAggressive,
    );

    // for speed-up transaction if gas used in transaction + 10%
    // is greater than aggressive use aggressive estimates
    if (
      gasUsedGreaterThanAggressive &&
      editGasMode === EDIT_GAS_MODES.SPEED_UP
    ) {
      updateTransactionUsingEstimate(PRIORITY_LEVELS.HIGH);
      return;
    }

    const maxFeePerGasMedium = gasFeeEstimates.medium?.suggestedMaxFeePerGas;
    const gasUsedGreaterThanMedium = bnGreaterThan(
      maxFeePerGasInTransaction,
      maxFeePerGasMedium,
    );
    if (gasUsedGreaterThanMedium) {
      updateTransactionUsingEstimate(PRIORITY_LEVELS.MINIMUM);
      return;
    }

    updateTransactionUsingEstimate(PRIORITY_LEVELS.MEDIUM, {
      previousMaxFeePerGas: transaction.txParams.maxFeePerGas,
    });
  }, [
    appIsLoading,
    currentModal,
    editGasMode,
    gasFeeEstimates,
    transaction,
    updateTransaction,
    updateTransactionUsingEstimate,
  ]);

  if (currentModal !== 'cancelSpeedupTransaction') return null;

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
            Submit
          </Button>
        </div>
      </>
    </Popover>
  );
};

export default CancelSpeedupPopover;

/**
 * todo
cancel, speedup submit
loader on edit fee
 */
