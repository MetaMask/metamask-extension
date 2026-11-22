import { queryOptions } from '@tanstack/react-query';
import type {
  PaymentMethod,
  PaymentMethodsResponse,
} from '@metamask/ramps-controller';
import { getRampsPaymentMethods } from '../../../store/controller-actions/ramps-controller';

type PaymentMethodsQueryParams = {
  regionCode: string;
  fiat: string;
  assetId: string;
  providerId: string;
};

export const rampsPaymentMethodsKeys = {
  all: () => ['ramps', 'paymentMethods'] as const,
  detail: ({
    regionCode,
    fiat,
    assetId,
    providerId,
  }: PaymentMethodsQueryParams) =>
    [
      ...rampsPaymentMethodsKeys.all(),
      regionCode.trim().toLowerCase(),
      fiat.trim().toLowerCase(),
      assetId,
      providerId,
    ] as const,
};

export const rampsPaymentMethodsOptions = (params: PaymentMethodsQueryParams) =>
  queryOptions({
    queryKey: rampsPaymentMethodsKeys.detail(params),
    queryFn: async (): Promise<PaymentMethod[]> => {
      const response = (await getRampsPaymentMethods(params.regionCode, {
        fiat: params.fiat,
        assetId: params.assetId,
        provider: params.providerId,
      })) as PaymentMethodsResponse;

      return response.payments;
    },
    staleTime: 5 * 60 * 1000,
  });
