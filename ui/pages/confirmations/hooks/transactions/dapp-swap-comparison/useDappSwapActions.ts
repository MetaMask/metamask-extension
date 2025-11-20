import {
  BatchTransaction,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { TxData } from '@metamask/bridge-controller';
import { toHex } from '@metamask/controller-utils';
import { useCallback } from 'react';

import { deleteDappSwapComparisonData } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapCheck } from './useDappSwapCheck';
import { useDappSwapComparisonMetrics } from './useDappSwapComparisonMetrics';

export function useDappSwapActions() {
  const { currentConfirmation, quoteSelectedForMMSwap } =
    useConfirmContext<TransactionMeta>();
  const { captureSwapSubmit } = useDappSwapComparisonMetrics();
  const { isSwapToBeCompared } = useDappSwapCheck();

  const updateSwapWithQuoteDetails = useCallback(
    (transactionMeta: TransactionMeta) => {
      if (!quoteSelectedForMMSwap) {
        return;
      }
      const { value, gasLimit, data, to } =
        quoteSelectedForMMSwap?.trade as TxData;
      transactionMeta.txParams = {
        ...transactionMeta.txParams,
        value,
        to,
        gas: toHex(gasLimit ?? 0),
        data,
      };
      if (quoteSelectedForMMSwap?.approval) {
        const {
          data: approvalData,
          to: approvalTo,
          gasLimit: approvalGasLimit,
          value: approvalValue,
        } = quoteSelectedForMMSwap?.approval as TxData;
        transactionMeta.batchTransactions = [
          {
            data: approvalData as Hex,
            to: approvalTo as Hex,
            gas: toHex(approvalGasLimit ?? 0),
            value: approvalValue as Hex,
            type: TransactionType.swapApproval,
            isAfter: false,
            maxFeePerGas: transactionMeta.txParams.maxFeePerGas as Hex,
            maxPriorityFeePerGas: transactionMeta.txParams
              .maxPriorityFeePerGas as Hex,
          } as BatchTransaction,
        ];
      }
      transactionMeta.batchTransactionsOptions = {};
      transactionMeta.nestedTransactions = undefined;
    },
    [quoteSelectedForMMSwap],
  );

  const onDappSwapCompleted = useCallback(() => {
    if (!isSwapToBeCompared) {
      return;
    }
    const uniqueId = currentConfirmation.securityAlertResponse?.securityAlertId;
    if (uniqueId) {
      deleteDappSwapComparisonData(uniqueId);
    }
    captureSwapSubmit();
  }, [
    isSwapToBeCompared,
    currentConfirmation?.securityAlertResponse?.securityAlertId,
  ]);

  return {
    updateSwapWithQuoteDetails,
    onDappSwapCompleted,
  };
}
