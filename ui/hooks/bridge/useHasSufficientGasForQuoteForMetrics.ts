import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  selectMinimumBalanceForRentExemptionInSOL,
  type QuoteMetadata,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import {
  computeHasSufficientGasForQuoteForMetrics,
  getFromNativeBalance,
  getFromToken,
  getQuoteRequest,
  resolveMinimumBalanceToKeep,
  type BridgeAppState,
} from '../../ducks/bridge/selectors';

/**
 * Builds a callback that computes the `hasSufficientGasForQuote` analytics value
 * for a given quote. The Redux-derived inputs (native balance, source token,
 * quote request, Solana rent reserve) are read once during render; the quote is
 * injected at call time so the same helper works both for the active quote
 * (available during render) and the submitted quote (only known inside the
 * submit callback).
 *
 * @returns A function `(quote) => boolean | null` mirroring
 * `computeHasSufficientGasForQuoteForMetrics`.
 */
export const useHasSufficientGasForQuoteForMetrics = () => {
  const nativeBalance = useSelector(getFromNativeBalance);
  const fromToken = useSelector(getFromToken);
  const quoteRequest = useSelector(getQuoteRequest);
  const minimumBalanceForRentExemptionInSOL = useSelector(
    (state: BridgeAppState) =>
      selectMinimumBalanceForRentExemptionInSOL(state.metamask),
  );

  return useCallback(
    (quote: (QuoteResponse & QuoteMetadata) | null): boolean | null => {
      const srcChainId = quoteRequest?.srcChainId ?? quote?.quote?.srcChainId;
      const minimumBalanceToKeep = resolveMinimumBalanceToKeep(
        srcChainId,
        minimumBalanceForRentExemptionInSOL,
      );
      return computeHasSufficientGasForQuoteForMetrics({
        quote,
        nativeBalance,
        fromToken,
        minimumBalanceToKeep,
      });
    },
    [
      nativeBalance,
      fromToken,
      quoteRequest,
      minimumBalanceForRentExemptionInSOL,
    ],
  );
};
