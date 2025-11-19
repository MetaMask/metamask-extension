/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';

import { useConfirmContext } from '../../../context/confirm';
import { useTransactionEventFragment } from '../../useTransactionEventFragment';
import { useSwapCheck } from './useSwapCheck';

export function useDappSwapComparisonMetrics() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { isSwapToBeCompared, isQuotedSwap } = useSwapCheck();
  const { id: transactionId } = currentConfirmation ?? {};

  const captureDappSwapComparisonProperties = useCallback(
    (params: {
      properties: Record<string, string>;
      sensitiveProperties?: Record<string, string>;
    }) => {
      updateTransactionEventFragment(
        {
          ...params,
        },
        transactionId,
      );
    },
    [transactionId, updateTransactionEventFragment],
  );

  const captureDappSwapComparisonDisplayProperties = useCallback(
    (properties: Record<string, string>) => {
      captureDappSwapComparisonProperties({
        properties,
      });
    },
    [captureDappSwapComparisonProperties],
  );

  const captureSwapSubmit = useCallback(() => {
    if (!isSwapToBeCompared) {
      return;
    }
    captureDappSwapComparisonProperties({
      properties: {
        swap_final_selected: isQuotedSwap ? 'metamask' : 'dapp',
      },
    });
  }, [captureDappSwapComparisonProperties, isQuotedSwap, isSwapToBeCompared]);

  const captureDappSwapComparisonLoading = useCallback(
    (commands: string) => {
      captureDappSwapComparisonProperties({
        properties: {
          swap_dapp_comparison: 'loading',
          swap_dapp_commands: commands,
        },
      });
    },
    [captureDappSwapComparisonProperties],
  );

  const captureDappSwapComparisonFailed = useCallback(
    (reason: string) => {
      captureDappSwapComparisonProperties({
        properties: {
          swap_dapp_comparison: reason ?? 'failed',
        },
      });
    },
    [captureDappSwapComparisonProperties],
  );

  return {
    captureDappSwapComparisonDisplayProperties,
    captureDappSwapComparisonFailed,
    captureDappSwapComparisonLoading,
    captureDappSwapComparisonMetricsProperties:
      captureDappSwapComparisonProperties,
    captureSwapSubmit,
  };
}
