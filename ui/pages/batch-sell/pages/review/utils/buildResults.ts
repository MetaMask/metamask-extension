import { toFinite } from 'lodash';
import { getBatchSellQuotes } from '../../../../../ducks/batch-sell/selectors';
import { QuoteValidationErrors } from '../../../../../ducks/bridge/types';
import {
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
  SendAssetEntry,
} from '../types';

// Shapes the raw bridge controller output into the `BatchSellQuotesResults`
// consumed by the review UI. Pulls validation findings in by entry index so
// each quote tile gets its own warning state.
export const buildResults = ({
  controllerResult,
  entries,
  receivedAsset,
  validationErrorsByIndex,
}: {
  controllerResult: ReturnType<typeof getBatchSellQuotes>;
  entries: SendAssetEntry[];
  receivedAsset: BatchSellQuotesConfig['receivedAsset'];
  validationErrorsByIndex: QuoteValidationErrors[];
}): BatchSellQuotesResults => {
  const { recommendedQuotes } = controllerResult;

  const quotes: BatchSellQuotesResults['quotes'] = Object.fromEntries(
    entries.map((entry, index) => {
      const recommendedQuote = recommendedQuotes[index];
      if (!entry.enabled || !recommendedQuote) {
        return [entry.assetId, { asset: entry.asset, hasQuote: false }];
      }
      const validation = validationErrorsByIndex[index];
      return [
        entry.assetId,
        {
          asset: entry.asset,
          slippagePercent: entry.slippagePercent,
          receivedAmount: toFinite(recommendedQuote.toTokenAmount?.amount),
          receivedAmountFiat: toFinite(
            recommendedQuote.toTokenAmount?.valueInCurrency,
          ),
          minimumReceivedAmount: toFinite(
            recommendedQuote.minToTokenAmount?.amount,
          ),
          hasQuote: true,
          hasHighPriceImpactWarning: Boolean(
            validation?.isPriceImpactWarning || validation?.isPriceImpactError,
          ),
          quoteBpsFee:
            // @ts-expect-error: controller types are not up to date yet
            recommendedQuote.quote?.feeData?.metabridge?.quoteBpsFee,
        },
      ];
    }),
  );

  // Recompute totals from only the enabled slots' quotes so the bridge
  // controller's pre-aggregated sums (which include disabled slots) don't
  // leak into the UI.
  const enabledRecommendedQuotes = entries
    .map((entry, index) => (entry.enabled ? recommendedQuotes[index] : null))
    .filter((quote): quote is NonNullable<typeof quote> => Boolean(quote));

  const sum = (values: (number | string | null | undefined)[]): number =>
    values.reduce<number>((acc, v) => acc + toFinite(v), 0);

  const totalReceivedAmount = sum(
    enabledRecommendedQuotes.map((q) => q.toTokenAmount?.amount),
  );
  const totalReceivedAmountFiat = sum(
    enabledRecommendedQuotes.map((q) => q.toTokenAmount?.valueInCurrency),
  );
  const minimumReceivedAmount = sum(
    enabledRecommendedQuotes.map((q) => q.minToTokenAmount?.amount),
  );
  const totalNetworkFee = sum(
    enabledRecommendedQuotes.map((q) => q.totalNetworkFee?.amount),
  );
  const totalNetworkFeeFiat = sum(
    enabledRecommendedQuotes.map((q) => q.totalNetworkFee?.valueInCurrency),
  );

  return {
    quotes,
    receivedAsset,
    totalReceivedAmount,
    totalReceivedAmountFiat,
    minimumReceivedAmount,
    totalNetworkFee,
    totalNetworkFeeFiat,
  };
};
