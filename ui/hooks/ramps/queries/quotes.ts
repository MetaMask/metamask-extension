import { queryOptions } from '@tanstack/react-query';
import type { QuotesResponse } from '@metamask/ramps-controller';
import {
  getRampsQuotes,
  type GetRampsQuotesParams,
} from '../../../store/controller-actions/ramps-controller';

export const RAMPS_QUOTES_STALE_TIME_MS = 15_000;

type RampsQuotesQueryParams = Pick<
  GetRampsQuotesParams,
  | 'assetId'
  | 'amount'
  | 'walletAddress'
  | 'redirectUrl'
  | 'forceRefresh'
  | 'ttl'
  | 'paymentMethods'
  | 'providers'
  | 'region'
  | 'fiat'
>;

export const rampsQuotesKeys = {
  all: () => ['ramps', 'quotes'] as const,
  detail: (params: RampsQuotesQueryParams) =>
    [
      ...rampsQuotesKeys.all(),
      params.assetId ?? '',
      params.amount,
      params.walletAddress,
      params.region ?? '',
      params.fiat ?? '',
      (params.paymentMethods ?? []).join(','),
      (params.providers ?? []).join(','),
      params.redirectUrl ?? '',
      Boolean(params.forceRefresh),
      params.ttl ?? null,
    ] as const,
};

export const rampsQuotesOptions = (params: RampsQuotesQueryParams) =>
  queryOptions({
    queryKey: rampsQuotesKeys.detail(params),
    queryFn: async (): Promise<QuotesResponse> => getRampsQuotes(params),
    staleTime: RAMPS_QUOTES_STALE_TIME_MS,
  });
