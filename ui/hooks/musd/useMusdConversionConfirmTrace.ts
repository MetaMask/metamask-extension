/**
 * useMusdConversionConfirmTrace Hook
 *
 * Traces the mUSD conversion confirmation time.
 * Start: Transaction status becomes 'approved'
 * End: Transaction reaches terminal status (confirmed, failed, dropped, rejected)
 *
 * Adapted from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionStatus.ts
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import { getTransactions } from '../../selectors/transactions';
import {
  selectTransactionPaymentTokenByTransactionId,
  selectTransactionPayQuotesByTransactionId,
  type TransactionPayState,
} from '../../selectors/transactionPayController';

/**
 * Terminal statuses that end the confirmation trace.
 */
const TERMINAL_STATUSES = [
  TransactionStatus.confirmed,
  TransactionStatus.failed,
  TransactionStatus.dropped,
  TransactionStatus.rejected,
] as const;

type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

function isTerminalStatus(status: string): status is TerminalStatus {
  return TERMINAL_STATUSES.includes(status as TerminalStatus);
}

/**
 * Hook for tracing mUSD conversion confirmation time.
 * Monitors mUSD conversion transactions and tracks:
 * - Start: When transaction status becomes 'approved'
 * - End: When transaction reaches terminal status
 */
export function useMusdConversionConfirmTrace(): void {
  const transactions = useSelector(getTransactions) as TransactionMeta[];

  // Track which transactions we've started/ended traces for
  const activeTracesRef = useRef<Map<string, boolean>>(new Map());

  // Filter to mUSD conversion transactions
  const musdConversions = transactions.filter(
    (tx) => tx.type === TransactionType.musdConversion,
  );

  // Monitor transaction status changes
  useEffect(() => {
    for (const tx of musdConversions) {
      const txId = tx.id;
      const hasActiveTrace = activeTracesRef.current.get(txId);

      // Start trace when transaction becomes approved
      if (tx.status === TransactionStatus.approved && !hasActiveTrace) {
        activeTracesRef.current.set(txId, true);

        trace({
          name: TraceName.MusdConversionConfirm,
          op: TraceOperation.MusdConversionOperation,
          id: txId,
          tags: {
            transactionId: txId,
          },
        });
      }

      // End trace when transaction reaches terminal status
      if (hasActiveTrace && isTerminalStatus(tx.status)) {
        activeTracesRef.current.set(txId, false);

        if (tx.status === TransactionStatus.confirmed) {
          endTrace({
            name: TraceName.MusdConversionConfirm,
            id: txId,
            data: {
              success: true,
            },
          });
        } else {
          endTrace({
            name: TraceName.MusdConversionConfirm,
            id: txId,
            data: {
              success: false,
              reason: tx.status,
            },
          });
        }
      }
    }
  }, [musdConversions]);

  // Cleanup: remove stale transaction IDs from tracking
  useEffect(() => {
    const currentTxIds = new Set(musdConversions.map((tx) => tx.id));

    for (const trackedId of activeTracesRef.current.keys()) {
      if (!currentTxIds.has(trackedId)) {
        activeTracesRef.current.delete(trackedId);
      }
    }
  }, [musdConversions]);
}

/**
 * Enhanced version with additional data from TransactionPayController.
 * Use this when you need detailed quote/token information in the trace.
 *
 * @param transactionId - The ID of the transaction to trace
 */
export function useMusdConversionConfirmTraceWithDetails(
  transactionId: string,
): void {
  const transactions = useSelector(getTransactions) as TransactionMeta[];

  const paymentToken = useSelector((state: TransactionPayState) =>
    transactionId
      ? selectTransactionPaymentTokenByTransactionId(state, transactionId)
      : undefined,
  );

  const quotes = useSelector((state: TransactionPayState) =>
    transactionId
      ? selectTransactionPayQuotesByTransactionId(state, transactionId)
      : undefined,
  );

  const activeTraceRef = useRef<boolean>(false);

  const tx = transactions.find(
    (t) => t.id === transactionId && t.type === TransactionType.musdConversion,
  );

  useEffect(() => {
    if (!tx) {
      return;
    }

    // Start trace when transaction becomes approved
    if (tx.status === TransactionStatus.approved && !activeTraceRef.current) {
      activeTraceRef.current = true;

      const selectedQuote = quotes?.[0] as
        | {
            strategy?: string;
            sourceChainId?: string;
            destinationChainId?: string;
          }
        | undefined;

      trace({
        name: TraceName.MusdConversionConfirm,
        op: TraceOperation.MusdConversionOperation,
        id: transactionId,
        tags: {
          transactionId,
          strategy: selectedQuote?.strategy ?? 'unknown',
        },
      });
    }

    // End trace when transaction reaches terminal status
    if (activeTraceRef.current && isTerminalStatus(tx.status)) {
      activeTraceRef.current = false;

      const selectedQuote = quotes?.[0] as
        | {
            strategy?: string;
            sourceChainId?: string;
            destinationChainId?: string;
          }
        | undefined;

      if (tx.status === TransactionStatus.confirmed) {
        endTrace({
          name: TraceName.MusdConversionConfirm,
          id: transactionId,
          data: {
            success: true,
            strategy: selectedQuote?.strategy ?? 'unknown',
            paymentTokenAddress: paymentToken?.address ?? 'unknown',
            paymentTokenChainId: paymentToken?.chainId ?? 'unknown',
          },
        });
      } else {
        endTrace({
          name: TraceName.MusdConversionConfirm,
          id: transactionId,
          data: {
            success: false,
            reason: tx.status,
          },
        });
      }
    }
  }, [tx, transactionId, paymentToken, quotes]);
}

export default useMusdConversionConfirmTrace;
