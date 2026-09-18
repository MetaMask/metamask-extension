import { v4 as uuidv4 } from 'uuid';
import {
  formatChainIdToCaip,
  type GenericQuoteRequest,
  type QuoteStreamCompleteReason,
} from '@metamask/bridge-controller';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';

export type SwapQuoteFetchTraceResult =
  | 'success'
  | 'cancelled'
  | 'no_quotes'
  | 'error';

let activeTraceId: string | undefined;

const finishTrace = (
  result: SwapQuoteFetchTraceResult,
  id: string | undefined = activeTraceId,
  reason?: QuoteStreamCompleteReason,
): void => {
  if (!id || activeTraceId !== id) {
    return;
  }

  endTrace({
    name: TraceName.SwapQuoteFetch,
    id,
    timestamp: Date.now(),
    data: {
      result,
      ...(result === 'no_quotes' || result === 'error'
        ? {
            /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
            no_quote_reason: reason ?? 'generic_error',
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        : {}),
    },
  });
  activeTraceId = undefined;
};

export const swapQuoteFetchTrace = {
  start({
    srcChainId,
    destChainId,
    isRefresh,
  }: {
    srcChainId?: GenericQuoteRequest['srcChainId'];
    destChainId?: GenericQuoteRequest['destChainId'];
    isRefresh: boolean;
  }): string {
    if (activeTraceId) {
      finishTrace('cancelled');
    }

    const id = uuidv4();
    const srcChainIdInCaip = srcChainId
      ? formatChainIdToCaip(srcChainId)
      : undefined;
    const destChainIdInCaip = destChainId
      ? formatChainIdToCaip(destChainId)
      : undefined;
    let swapType: 'single_chain' | 'crosschain' | undefined;
    if (srcChainIdInCaip && destChainIdInCaip) {
      swapType =
        srcChainIdInCaip === destChainIdInCaip ? 'single_chain' : 'crosschain';
    }

    trace({
      name: TraceName.SwapQuoteFetch,
      op: TraceOperation.BridgeDataFetch,
      id,
      data: {
        /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
        request_id: id,
        isRefresh,
        ...(swapType && { swap_type: swapType }),
        ...(srcChainIdInCaip && { src_chain_id: srcChainIdInCaip }),
        ...(destChainIdInCaip && { dest_chain_id: destChainIdInCaip }),
        /* eslint-enable @typescript-eslint/naming-convention */
      },
      startTime: Date.now(),
    });
    activeTraceId = id;
    return id;
  },

  finish(
    result: SwapQuoteFetchTraceResult,
    id?: string,
    reason?: QuoteStreamCompleteReason,
  ): void {
    finishTrace(result, id, reason);
  },
};
