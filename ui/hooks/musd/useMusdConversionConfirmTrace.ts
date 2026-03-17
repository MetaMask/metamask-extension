/**
 * useMusdConversionConfirmTrace Hook
 *
 * Traces the mUSD conversion confirmation time with quote details.
 * Start: Transaction first appears in an in-flight status (approved/signed/submitted)
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
 * In-flight statuses that indicate the user approved the transaction.
 * The `approved` status is extremely transient (transitions to `signed`
 * then `submitted` within the same tick), so we match any of these to
 * reliably detect when to start the trace.
 */
const IN_FLIGHT_STATUSES: string[] = [
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];

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
 * Hook for tracing mUSD conversion confirmation time with quote details.
 * Monitors a specific mUSD conversion transaction and tracks:
 * - Start: When transaction first appears in an in-flight status
 * - End: When transaction reaches terminal status
 *
 * Includes detailed quote/token information in the trace data.
 *
 * @param transactionId - The ID of the transaction to trace
 */
export function useMusdConversionConfirmTrace(transactionId: string): void {
  const activeTraceRef = useRef<boolean>(false);
  const startTimeRef = useRef<number | null>(null);
  const tracedTxIdRef = useRef<string | null>(null);
  // Cache payment token, quote, and chain data at trace start so it survives
  // the TransactionPayController clearing the data on completion.
  const traceContextRef = useRef<{
    paymentTokenAddress: string;
    paymentTokenChainId: string;
    transactionChainId: string;
    strategy: string;
  } | null>(null);
  const mountedRef = useRef(false);

  // Once a trace starts, keep tracking the original transaction ID even if
  // the prop becomes empty (the tx leaves the pending pool on confirmation).
  const effectiveTxId = activeTraceRef.current
    ? (tracedTxIdRef.current ?? transactionId)
    : transactionId;

  const transactions = useSelector(getTransactions) as TransactionMeta[];

  const paymentToken = useSelector((state: TransactionPayState) =>
    effectiveTxId
      ? selectTransactionPaymentTokenByTransactionId(state, effectiveTxId)
      : undefined,
  );

  const quotes = useSelector((state: TransactionPayState) =>
    effectiveTxId
      ? selectTransactionPayQuotesByTransactionId(state, effectiveTxId)
      : undefined,
  );

  const tx = transactions.find(
    (t) => t.id === effectiveTxId && t.type === TransactionType.musdConversion,
  );

  // Log on first mount
  if (!mountedRef.current) {
    mountedRef.current = true;
  }

  useEffect(() => {
    if (!tx) {
      return;
    }

    // Start trace when the transaction first appears in any in-flight state
    if (IN_FLIGHT_STATUSES.includes(tx.status) && !activeTraceRef.current) {
      activeTraceRef.current = true;
      startTimeRef.current = Date.now();
      tracedTxIdRef.current = tx.id;

      const selectedQuote = quotes?.[0] as
        | {
            strategy?: string;
            sourceChainId?: string;
            destinationChainId?: string;
          }
        | undefined;

      const ctx = {
        paymentTokenAddress: paymentToken?.address ?? 'unknown',
        paymentTokenChainId: paymentToken?.chainId ?? 'unknown',
        transactionChainId: tx.chainId ?? 'unknown',
        strategy: selectedQuote?.strategy ?? 'unknown',
      };
      traceContextRef.current = ctx;

      trace({
        name: TraceName.MusdConversionConfirm,
        op: TraceOperation.MusdConversionOperation,
        id: tx.id,
        tags: { transactionId: tx.id, ...ctx },
      });
    }

    // Keep the cached context up-to-date while data is still available,
    // in case selectors populated after the initial trace start.
    if (activeTraceRef.current && traceContextRef.current) {
      const selectedQuote = quotes?.[0] as { strategy?: string } | undefined;
      if (paymentToken?.address) {
        traceContextRef.current.paymentTokenAddress = paymentToken.address;
      }
      if (paymentToken?.chainId) {
        traceContextRef.current.paymentTokenChainId = paymentToken.chainId;
      }
      if (tx.chainId) {
        traceContextRef.current.transactionChainId = tx.chainId;
      }
      if (selectedQuote?.strategy) {
        traceContextRef.current.strategy = selectedQuote.strategy;
      }
    }

    // End trace when transaction reaches terminal status
    if (activeTraceRef.current && isTerminalStatus(tx.status)) {
      activeTraceRef.current = false;

      const ctx = traceContextRef.current;

      const endData = {
        success: tx.status === TransactionStatus.confirmed,
        status: tx.status,
        transactionChainId: ctx?.transactionChainId ?? tx.chainId ?? 'unknown',
        paymentTokenAddress: ctx?.paymentTokenAddress ?? 'unknown',
        paymentTokenChainId: ctx?.paymentTokenChainId ?? 'unknown',
        ...(tx.status === TransactionStatus.confirmed && {
          strategy: ctx?.strategy ?? 'unknown',
        }),
      };

      endTrace({
        name: TraceName.MusdConversionConfirm,
        id: tx.id,
        data: endData,
      });

      startTimeRef.current = null;
      tracedTxIdRef.current = null;
      traceContextRef.current = null;
    }
  }, [tx, transactionId, paymentToken, quotes]);
}

export default useMusdConversionConfirmTrace;
