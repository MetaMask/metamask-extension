/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useRef } from 'react';

import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapContext } from '../../../context/dapp-swap';
import { useTransactionEventFragment } from '../../useTransactionEventFragment';

export function useDappSwapComparisonMetrics() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isQuotedSwapDisplayedInInfo, isQuotedSwapPresent } =
    useDappSwapContext();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { id: transactionId } = currentConfirmation ?? {};
  const swapDappComparison = useRef('loading');

  const captureDappSwapComparisonProperties = useCallback(
    (params: {
      properties: Record<string, string>;
      sensitiveProperties?: Record<string, string>;
    }) => {
      console.log(
        '--------------------------------------------------- 1',
        params,
      );
      swapDappComparison.current = params.properties.swap_dapp_comparison;
      updateTransactionEventFragment(params, transactionId);
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
    if (!isQuotedSwapPresent) {
      return;
    }
    captureDappSwapComparisonProperties({
      properties: {
        swap_final_selected: isQuotedSwapDisplayedInInfo ? 'metamask' : 'dapp',
      },
    });
  }, [
    captureDappSwapComparisonProperties,
    isQuotedSwapDisplayedInInfo,
    isQuotedSwapPresent,
  ]);

  const captureDappSwapComparisonLoading = useCallback(
    (commands: string) => {
      captureDappSwapComparisonProperties({
        properties: {
          // Using swapDappComparison.current below will ensure that failure in fetching quotes
          // in middleware is not overridden by loading state from UI
          swap_dapp_comparison: swapDappComparison.current ?? 'loading',
          swap_dapp_commands: commands,
        },
      });
    },
    [captureDappSwapComparisonProperties],
  );

  const captureDappSwapComparisonFailed = useCallback(
    (reason: string, commands?: string) => {
      captureDappSwapComparisonProperties({
        properties: {
          swap_dapp_comparison: reason ?? 'failed',
          swap_dapp_commands: commands ?? '',
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
