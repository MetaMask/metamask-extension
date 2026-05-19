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
  const { recommendedQuotes, totalReceived, minimumReceived, totalNetworkFee } =
    controllerResult;

  const quotes: BatchSellQuotesResults['quotes'] = Object.fromEntries(
    entries.map((entry, index) => {
      const recommendedQuote = recommendedQuotes[index];
      if (!recommendedQuote) {
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

  return {
    quotes,
    receivedAsset,
    totalReceivedAmount: toFinite(totalReceived?.amount),
    totalReceivedAmountFiat: toFinite(totalReceived?.valueInCurrency),
    minimumReceivedAmount: toFinite(minimumReceived?.amount),
    totalNetworkFee: toFinite(totalNetworkFee?.amount),
    totalNetworkFeeFiat: toFinite(totalNetworkFee?.valueInCurrency),
  };
};
