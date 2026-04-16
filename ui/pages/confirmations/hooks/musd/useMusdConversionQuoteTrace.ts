/**
 * useMusdConversionQuoteTrace Hook
 *
 * Traces the mUSD conversion quote fetch time.
 * Start: When quote loading begins (after debounced amount change)
 * End: Loading completes (with or without quotes)
 *
 * Adapted from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionQuoteTrace.ts
 *
 * Note: Mobile uses a manual "Done" button to trigger trace start.
 * Extension uses automatic debounced fetching, so we start the trace
 * when loading begins.
 */

import { useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
} from '../../../../../shared/lib/trace';
import { useConfirmContext } from '../../context/confirm';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
} from '../pay/useTransactionPayData';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';

/**
 * Hook for tracing mUSD conversion quote fetch time.
 * Automatically tracks loading state changes to measure quote fetch duration.
 */
export function useMusdConversionQuoteTrace(): void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const { payToken } = useTransactionPayToken();
  const quotes = useTransactionPayQuotes();
  const isLoading = useIsTransactionPayLoading();

  // Track current trace state
  const traceIdRef = useRef<string | null>(null);
  const wasLoadingRef = useRef(false);

  // Start trace when loading begins, end when loading completes
  useEffect(() => {
    // Detect transition from not-loading to loading (start trace)
    if (isLoading && !wasLoadingRef.current) {
      // Generate unique trace ID for this quote fetch
      const newTraceId = `quote_${transactionId}_${Date.now()}`;
      traceIdRef.current = newTraceId;

      const traceData = {
        name: TraceName.MusdConversionQuote,
        op: TraceOperation.MusdConversionDataFetch,
        id: newTraceId,
        tags: {
          transactionId: transactionId || 'unknown',
          payTokenAddress: payToken?.address ?? 'unknown',
          payTokenChainId: payToken?.chainId ?? 'unknown',
        },
      };

      trace(traceData);
    }

    // Detect transition from loading to not-loading (end trace)
    if (!isLoading && wasLoadingRef.current && traceIdRef.current) {
      const hasQuotes = Boolean(quotes?.length);

      if (hasQuotes) {
        const endData = {
          success: true,
          quoteCount: quotes?.length ?? 0,
          strategy:
            (quotes?.[0] as { strategy?: string })?.strategy ?? 'unknown',
        };

        endTrace({
          name: TraceName.MusdConversionQuote,
          id: traceIdRef.current,
          data: endData,
        });
      } else {
        const endData = {
          success: false,
          reason: 'no_quotes',
        };

        endTrace({
          name: TraceName.MusdConversionQuote,
          id: traceIdRef.current,
          data: endData,
        });
      }

      traceIdRef.current = null;
    }

    wasLoadingRef.current = isLoading;
  }, [isLoading, quotes, transactionId, payToken?.address, payToken?.chainId]);

  // End any active trace on unmount to prevent orphaned entries in tracesByKey
  useEffect(() => {
    return () => {
      if (traceIdRef.current) {
        endTrace({
          name: TraceName.MusdConversionQuote,
          id: traceIdRef.current,
          data: { success: false, reason: 'unmounted' },
        });
        traceIdRef.current = null;
      }
    };
  }, []);
}

export default useMusdConversionQuoteTrace;
