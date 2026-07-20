import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  isNativeAddress,
  selectMinimumBalanceForRentExemptionInSOL,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import {
  getFromNativeBalance,
  getFromToken,
  getQuoteRequest,
  isNativeBalanceInsufficientForQuote,
  resolveMinimumBalanceToKeep,
  type BridgeAppState,
} from '../../ducks/bridge/selectors';

/**
 * Computes whether the native balance covers the gas cost of a given quote.
 * Mirrors the `isInsufficientGasForQuote` balance math (negated) but omits the
 * `isGasless` and `isNetworkFeeUnavailable` gates so the value reflects raw gas
 * sufficiency for the passed quote. Used only for the `hasSufficientGasForQuote`
 * analytics property.
 *
 * @param options
 * @param options.quote - The quote to evaluate (e.g. the active or submitted quote)
 * @param options.nativeBalance - The from-account native balance
 * @param options.minimumBalanceToKeep - Native amount to reserve on the source chain
 * @returns `true`/`false` when computable, or `null` when a required input is missing
 */
export const computeHasSufficientGasForQuoteForMetrics = ({
  quote,
  nativeBalance,
  minimumBalanceToKeep,
}: {
  quote: QuoteResponse | null;
  nativeBalance: ReturnType<typeof getFromNativeBalance>;
  minimumBalanceToKeep: string;
}): boolean | null => {
  const fromToken = quote?.quote?.src?.asset;
  // For the MAX native case we return null because it does not make sense to check this (gas is substrated from the sent amount)
  if (!nativeBalance || !quote || !fromToken) {
    return null;
  }

  if (
    isNativeAddress(fromToken.assetId) &&
    new BigNumber(nativeBalance)
      .sub(quote.quote.src.normalizedAmount ?? '0')
      .lte(0)
  ) {
    return null;
  }

  return !isNativeBalanceInsufficientForQuote(
    quote,
    nativeBalance,
    fromToken.assetId,
    minimumBalanceToKeep,
  );
};

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
    (quote: QuoteResponse | null): boolean | null => {
      const srcChainId = quoteRequest?.srcChainId ?? quote?.chainId;
      const minimumBalanceToKeep = resolveMinimumBalanceToKeep(
        srcChainId,
        minimumBalanceForRentExemptionInSOL,
      );
      return computeHasSufficientGasForQuoteForMetrics({
        quote,
        nativeBalance,
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
