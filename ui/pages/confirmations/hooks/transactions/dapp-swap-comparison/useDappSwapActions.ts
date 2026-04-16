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
import { useDappSwapContext } from '../../../context/dapp-swap';
import { useDappSwapComparisonMetrics } from './useDappSwapComparisonMetrics';

export function useDappSwapActions() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isQuotedSwapDisplayedInInfo, selectedQuote } = useDappSwapContext();
  const { captureSwapSubmit } = useDappSwapComparisonMetrics();

  const updateSwapWithQuoteDetailsIfRequired = useCallback(
    (transactionMeta: TransactionMeta) => {
      captureSwapSubmit();
      if (!isQuotedSwapDisplayedInInfo) {
        return;
      }
      const { value, gasLimit, data, to } = selectedQuote?.trade as TxData;
      transactionMeta.txParams = {
        ...transactionMeta.txParams,
        value,
        to,
        gas: toHex(gasLimit ?? 0),
        data,
      };
      if (selectedQuote?.approval) {
        const {
          data: approvalData,
          to: approvalTo,
          gasLimit: approvalGasLimit,
          value: approvalValue,
        } = selectedQuote?.approval as TxData;
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
    [captureSwapSubmit, isQuotedSwapDisplayedInInfo, selectedQuote],
  );

  const onDappSwapCompleted = useCallback(() => {
    const uniqueId = currentConfirmation?.requestId;
    if (uniqueId) {
      deleteDappSwapComparisonData(uniqueId);
    }
  }, [currentConfirmation?.requestId]);

  return {
    updateSwapWithQuoteDetailsIfRequired,
    onDappSwapCompleted,
  };
}
