import { queryOptions } from '@tanstack/react-query';
import type { Provider } from '@metamask/ramps-controller';
import { getRampsProviders } from '../../../store/controller-actions/ramps-controller';

interface ProvidersQueryParams {
  regionCode: string;
}

export const rampsProvidersKeys = {
  all: () => ['ramps', 'providers'] as const,
  detail: ({ regionCode }: ProvidersQueryParams) =>
    [...rampsProvidersKeys.all(), regionCode.trim().toLowerCase()] as const,
};

export const rampsProvidersOptions = (params: ProvidersQueryParams) =>
  queryOptions({
    queryKey: rampsProvidersKeys.detail(params),
    queryFn: async (): Promise<Provider[]> => {
      const response = await getRampsProviders(params.regionCode);
      return response.providers;
    },
    staleTime: 15 * 60 * 1000,
  });
