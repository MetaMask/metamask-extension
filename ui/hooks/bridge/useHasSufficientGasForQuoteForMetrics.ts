import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  hasSufficientGasForQuote,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import {
  getQuoteRequest,
  type BridgeAppState,
  getFromBalances,
} from '../../ducks/bridge/selectors';
import {
  resolveGasCheckMinimumBalance,
  resolveMinimumBalanceToKeep,
} from '../../pages/bridge/utils/minimum-reserve';

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
  const balances = useSelector(getFromBalances);
  const quoteRequest = useSelector(getQuoteRequest);
  // TODO read reserve balance for other networks
  const minimumBalanceForRentExemptionInLamports = useSelector(
    (state: BridgeAppState) =>
      state.metamask.minimumBalanceForRentExemptionInLamports,
  );

  return useCallback(
    (quote: QuoteResponse | null): boolean | null => {
      const srcChainId = quoteRequest?.srcChainId ?? quote?.chainId;
      const minimumBalanceToKeep = resolveMinimumBalanceToKeep(
        srcChainId,
        minimumBalanceForRentExemptionInLamports,
      );
      if (!quote) {
        return null;
      }
      return (
        hasSufficientGasForQuote({
          balances,
          quote: quote?.quote,
          minimumBalance: resolveGasCheckMinimumBalance(
            quote,
            minimumBalanceToKeep,
          ),
          ignoreGasLessFlags: true,
        }) ?? null
      );
    },
    [balances, quoteRequest, minimumBalanceForRentExemptionInLamports],
  );
};
