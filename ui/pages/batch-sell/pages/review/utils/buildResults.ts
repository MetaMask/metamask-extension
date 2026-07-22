import { toFinite } from 'lodash';
import { getBatchSellQuotes } from '../../../../../ducks/batch-sell/selectors';
import { QuoteValidationErrors } from '../../../../../ducks/bridge/types';
import {
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
  SendAssetEntry,
} from '../types';

export const buildResults = ({
  controllerResult,
  entries,
  receivedAsset,
  validationErrorsByIndex,
  isLoading,
}: {
  controllerResult: Partial<ReturnType<typeof getBatchSellQuotes>>;
  entries: SendAssetEntry[];
  receivedAsset: BatchSellQuotesConfig['receivedAsset'];
  validationErrorsByIndex: QuoteValidationErrors[];
  isLoading: boolean;
}): BatchSellQuotesResults => {
  const { recommendedQuotes, totalReceived, minimumReceived } =
    controllerResult;

  // Quotes are requested only for enabled entries, so `recommendedQuotes` (and
  // the per-slot validation errors) are positionally aligned with the enabled
  // entries in order. Walk the full entries list and advance a separate cursor
  // for each enabled entry to map it back onto its controller slot.
  let enabledSlotIndex = 0;
  const quotes: BatchSellQuotesResults['quotes'] = Object.fromEntries(
    entries.map((entry) => {
      if (!entry.enabled) {
        return [
          entry.assetId,
          {
            asset: entry.asset,
            quote: null,
            hasQuote: false,
            isLoadingQuote: false,
          },
        ];
      }

      const slotIndex = enabledSlotIndex;
      enabledSlotIndex += 1;
      const recommendedQuote = recommendedQuotes?.[slotIndex];
      if (!recommendedQuote) {
        return [
          entry.assetId,
          {
            asset: entry.asset,
            quote: null,
            hasQuote: false,
            isLoadingQuote: isLoading,
          },
        ];
      }
      const validation = validationErrorsByIndex[slotIndex];
      return [
        entry.assetId,
        {
          asset: entry.asset,
          quote: recommendedQuote,
          slippagePercent: entry.slippagePercent,
          receivedAmount: toFinite(
            recommendedQuote.quote.dest.normalizedAmount,
          ),
          receivedAmountFiat: toFinite(
            recommendedQuote.quote.dest.valueInCurrency,
          ),
          minimumReceivedAmount: toFinite(
            recommendedQuote.quote.dest.minAmountNormalized,
          ),
          hasQuote: true,
          isLoadingQuote: false,
          hasHighPriceImpactWarning: Boolean(
            validation?.isPriceImpactWarning || validation?.isPriceImpactError,
          ),
          quoteBpsFee:
            recommendedQuote.quote?.feeData?.metabridge?.[0]?.quoteBpsFee,
        },
      ];
    }),
  );

  // Totals come straight from the controller's pre-aggregated sums. Because
  // quotes are requested only for enabled entries, these already exclude
  // disabled slots, so the UI does not re-sum anything itself. They stay
  // `undefined` until the first quote lands so consumers can render a skeleton
  // instead of a deceptive "0".
  const hasAnyQuote = recommendedQuotes?.some((quote) => Boolean(quote));
  const totalReceivedAmount = hasAnyQuote
    ? toFinite(totalReceived?.normalizedAmount)
    : undefined;
  const totalReceivedAmountFiat = hasAnyQuote
    ? toFinite(totalReceived?.valueInCurrency)
    : undefined;
  const minimumReceivedAmount = hasAnyQuote
    ? toFinite(minimumReceived?.normalizedAmount)
    : undefined;

  return {
    quotes,
    receivedAsset,
    totalReceivedAmount,
    totalReceivedAmountFiat,
    minimumReceivedAmount,
  };
};
