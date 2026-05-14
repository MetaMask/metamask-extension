import { useQuery } from '@tanstack/react-query';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';

export const useBatchSellQuotesFetching = ({
  sendAssetsConfig,
  receivedAsset,
}: BatchSellQuotesConfig) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      'batch-sell',
      receivedAsset.id,
      ...Object.values(sendAssetsConfig).map(
        ({ asset, sendAmountPercent, slippagePercent }) =>
          [asset.assetId, sendAmountPercent, slippagePercent].join('-'),
      ),
    ],
    cacheTime: 0,
    staleTime: 0,
    queryFn: async (): Promise<BatchSellQuotesResults> => {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const quotes: BatchSellQuotesResults['quotes'] = Object.fromEntries(
        Object.entries(sendAssetsConfig).map(
          ([assetId, { asset, sendAmountPercent, slippagePercent }]) => [
            assetId,
            Math.random() < 0.5
              ? {
                  asset,
                  hasQuote: false,
                }
              : {
                  asset,
                  slippagePercent,
                  receivedAmount: 847.34,
                  receivedAmountFiat: 590,
                  minimumReceivedAmount: 846.2,
                  hasQuote: true,
                  hasHighPriceImpactWarning: Math.random() < 0.5,
                },
          ],
        ),
      );

      const quoteValues = Object.values(quotes);

      const totalReceivedAmount = quoteValues.reduce(
        (sum, q) => sum + (q?.receivedAmount ?? 0),
        0,
      );

      const minimumReceivedAmount = quoteValues.reduce(
        (sum, q) => sum + (q?.minimumReceivedAmount ?? 0),
        0,
      );

      const totalReceivedAmountFiat = quoteValues.reduce(
        (sum, q) => sum + (q?.receivedAmountFiat ?? 0),
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
