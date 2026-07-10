import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  BuyWidget,
  Quote,
  QuotesResponse,
} from '@metamask/ramps-controller';
import {
  getRampsBuyWidgetData,
  getRampsQuotes,
  type GetRampsQuotesParams,
} from '../../store/controller-actions/ramps-controller';
import { rampsQueries } from './queries';
import type { RampsQueryStatus } from './useRampsPaymentMethods';

export type UseRampsQuotesResult = {
  getQuotes: (options: GetRampsQuotesParams) => Promise<QuotesResponse>;
  getBuyWidgetData: (quote: Quote) => Promise<BuyWidget | null>;
  data: QuotesResponse | null;
  loading: boolean;
  status: RampsQueryStatus;
  isSuccess: boolean;
  error: unknown | null;
};

export function useRampsQuotes(
  options?: GetRampsQuotesParams | null,
): UseRampsQuotesResult {
  const getQuotes = useCallback(
    (opts: GetRampsQuotesParams) => getRampsQuotes(opts),
    [],
  );

  const getBuyWidgetData = useCallback(
    (quote: Quote) => getRampsBuyWidgetData(quote),
    [],
  );

  const queryEnabled = Boolean(
    options?.assetId && options.walletAddress && options.amount > 0,
  );

  const quotesQuery = useQuery({
    ...rampsQueries.quotes.options({
      assetId: options?.assetId,
      amount: options?.amount ?? 0,
      walletAddress: options?.walletAddress ?? '',
      redirectUrl: options?.redirectUrl,
      paymentMethods: options?.paymentMethods,
      providers: options?.providers,
      forceRefresh: options?.forceRefresh,
      ttl: options?.ttl,
    }),
    enabled: queryEnabled,
  });

  const status = useMemo<RampsQueryStatus>(() => {
    if (!queryEnabled) {
      return 'idle';
    }
    if (quotesQuery.isLoading) {
      return 'loading';
    }
    if (quotesQuery.isError) {
      return 'error';
    }
    return 'success';
  }, [queryEnabled, quotesQuery.isError, quotesQuery.isLoading]);

  return {
    getQuotes,
    getBuyWidgetData,
    data: quotesQuery.data ?? null,
    loading: queryEnabled && quotesQuery.isLoading,
    status,
    isSuccess: status === 'success',
    error: quotesQuery.error ?? null,
  };
}

export default useRampsQuotes;
