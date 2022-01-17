import React from 'react';
import BigNumber from 'bignumber.js';

import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import { decGWEIToHexWEI } from '../../../../../shared/modules/conversion.utils';
import { useTransactionModalContext } from '../../../../contexts/transaction-modal';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useTransactionMetrics } from '../../../../hooks/useTransactionMetrics';
import Button from '../../../ui/button';
import I18nValue from '../../../ui/i18n-value';

import { useAdvancedGasFeePopoverContext } from '../context';

const getDifference = (num1, num2) =>
  new BigNumber(num1, 10).minus(new BigNumber(num2, 10)).toNumber();

const AdvancedGasFeeSaveButton = () => {
  const { closeAllModals } = useTransactionModalContext();
  const { captureTransactionMetricsForEIP1559V2 } = useTransactionMetrics();
  const { updateTransaction } = useGasFeeContext();
  const {
    gasLimit,
    hasErrors,
    initialGasValues,
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
    captureTransactionMetricsForEIP1559V2({
      action: 'Advanced gas fee modal',
      name: 'Transaction Approved',
      variables: gasValues,
    });
    captureTransactionMetricsForEIP1559V2({
      action: 'Advanced gas fee modal',
      name: 'Transaction Added',
      variables: {
        differences: {
          gasLimit: getDifference(gasLimit, initialGasValues.gasLimit),
          maxFeePerGas: getDifference(
            maxFeePerGas,
            initialGasValues.maxFeePerGas,
          ),
          maxPriorityFeePerGas: getDifference(
            maxPriorityFeePerGas,
            initialGasValues.maxPriorityFeePerGas,
          ),
        },
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
