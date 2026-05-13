import { useQuery } from '@tanstack/react-query';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';

export const useBatchSellQuotesFetching = ({
  sendAssets,
  receivedAsset,
}: BatchSellQuotesConfig) => {
  const { data, isLoading } = useQuery({
    queryKey: ['batch-sell', receivedAsset.assetId, Object.keys(sendAssets)],
    queryFn: async (): Promise<BatchSellQuotesResults> => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const quotes = Object.fromEntries(
        Object.entries(sendAssets).map(
          ([assetId, { asset, sendAmountPercent, slippagePercent }]) => [
            assetId,
            {
              asset,
              slippagePercent,
              receivedAmount: 847.34,
              receivedAmountFiat: 590,
              minimumReceivedAmount: 846.2,
              hasQuote: true as const,
              hasHighPriceImpactWarning: false,
            },
          ],
        ),
      );

      const quoteValues = Object.values(quotes);

      const totalReceivedAmount = quoteValues.reduce(
        (sum, q) => sum + (q.receivedAmount ?? 0),
        0,
      );

      const minimumReceivedAmount = quoteValues.reduce(
        (sum, q) => sum + (q.minimumReceivedAmount ?? 0),
        0,
      );

      const totalReceivedAmountFiat = quoteValues.reduce(
        (sum, q) => sum + (q.receivedAmountFiat ?? 0),
        0,
      );

      return {
        quotes,
        receivedAsset,
        minimumReceivedAmount,
        totalReceivedAmount,
        totalReceivedAmountFiat,
      };
    },
  });

  return { data, isLoading };
};
