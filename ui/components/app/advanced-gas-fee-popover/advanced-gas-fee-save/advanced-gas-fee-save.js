import React from 'react';

import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import { decGWEIToHexWEI } from '../../../../../shared/modules/conversion.utils';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import Button from '../../../ui/button';
import I18nValue from '../../../ui/i18n-value';

import { useAdvancedGasFeePopoverContext } from '../context';

const AdvancedGasFeeSaveButton = () => {
  const { closeAllModals } = useTransactionModalContext();
  const { captureTransactionEvent } = useTransactionEventFragment();
  const { updateTransaction } = useGasFeeContext();
  const {
    gasLimit,
    hasErrors,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = useAdvancedGasFeePopoverContext();

  const onSave = () => {
    const gasValues = {
      maxFeePerGas: decGWEIToHexWEI(maxFeePerGas),
      maxPriorityFeePerGas: decGWEIToHexWEI(maxPriorityFeePerGas),
      gasLimit,
    };
    updateTransaction({
      estimateUsed: PRIORITY_LEVELS.CUSTOM,
      ...gasValues,
    });
    captureTransactionEvent({
      action: 'Transaction Updated with new Custom Estimates',
      screen: 'Advanced gas fee modal',
      variables: {
        gasValues,
      },
    });
    closeAllModals();
  };

  return (
    <Button type="primary" disabled={hasErrors} onClick={onSave}>
      <I18nValue messageKey="save" />
    </Button>
  );
};

export default AdvancedGasFeeSaveButton;
