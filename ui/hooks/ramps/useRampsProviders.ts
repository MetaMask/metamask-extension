import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Provider } from '@metamask/ramps-controller';
import {
  selectProviders,
  selectProviderAutoSelected,
  selectRampsOrdersForSelectedAccount,
  selectUserRegion,
} from '../../selectors/rampsController';
import {
  setRampsSelectedPaymentMethod,
  setRampsSelectedProvider,
} from '../../store/controller-actions/ramps-controller';
import {
  completedOrdersFromRampsOrders,
  determinePreferredProvider,
} from './utils/determinePreferredProvider';
import { parseUserFacingError } from './utils/parseUserFacingError';
import { rampsQueries } from './queries';

export type UseRampsProvidersResult = {
  providers: Provider[];
  selectedProvider: Provider | null;
  setSelectedProvider: (
    provider: Provider | null,
    options?: { autoSelected?: boolean },
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function useRampsProviders(options?: {
  enableSideEffects?: boolean;
}): UseRampsProvidersResult {
  const enableSideEffects = options?.enableSideEffects ?? false;
  const providersState = useSelector(selectProviders);
  const {
    data: providersStateData,
    selected: selectedProvider,
    isLoading: providersStateIsLoading,
    error: providersStateError,
  } = providersState;

  const userRegion = useSelector(selectUserRegion);
  const regionCode = userRegion?.regionCode ?? '';
  const queryClient = useQueryClient();

  const setSelectedProvider = useCallback(
    (provider: Provider | null, setOptions?: { autoSelected?: boolean }) =>
      setRampsSelectedProvider(provider?.id ?? null, setOptions),
    [],
  );

  const prevRegionRef = useRef(regionCode);
  useEffect(() => {
    if (
      enableSideEffects &&
      regionCode &&
      prevRegionRef.current !== regionCode
    ) {
      const previousRegion = prevRegionRef.current;
      prevRegionRef.current = regionCode;
      queryClient.invalidateQueries({
        queryKey: ['ramps'],
        refetchType: 'none',
      });
      if (previousRegion) {
        setSelectedProvider(null);
        setRampsSelectedPaymentMethod(null);
      }
    }
  }, [enableSideEffects, regionCode, queryClient, setSelectedProvider]);

  const providersQuery = useQuery({
    ...rampsQueries.providers.options({ regionCode }),
    enabled: Boolean(regionCode),
  });

  const providers = useMemo(
    () => providersQuery?.data ?? providersStateData ?? [],
    [providersQuery?.data, providersStateData],
  );

  const controllerOrders = useSelector(selectRampsOrdersForSelectedAccount);
  const providerAutoSelected = useSelector(selectProviderAutoSelected);
  const completedOrders = useMemo(
    () => completedOrdersFromRampsOrders(controllerOrders),
    [controllerOrders],
  );

  useEffect(() => {
    if (!enableSideEffects || !providers?.length) {
      return;
    }

    if (
      selectedProvider &&
      !providers.some((provider) => provider.id === selectedProvider.id)
    ) {
      setSelectedProvider(null);
      setRampsSelectedPaymentMethod(null);
      return;
    }

    // Re-evaluate when an auto-selected default (e.g. Transak) was chosen before
    // completed order history arrived from Portfolio/User Storage sync.
    const shouldReevaluateAutoSelection =
      Boolean(selectedProvider) &&
      providerAutoSelected &&
      completedOrders.length > 0;

    if (!selectedProvider || shouldReevaluateAutoSelection) {
      const result = determinePreferredProvider(completedOrders, providers);
      if (
        result &&
        (!selectedProvider || result.provider.id !== selectedProvider.id)
      ) {
        setSelectedProvider(result.provider, {
          autoSelected: result.autoSelected,
        });
      }
    }
  }, [
    enableSideEffects,
    providers,
    selectedProvider,
    providerAutoSelected,
    completedOrders,
    setSelectedProvider,
  ]);

  let error: string | null = null;
  if (providersQuery?.error) {
    error = parseUserFacingError(
      providersQuery.error,
      'Failed to load providers',
    );
  } else if (providersStateError) {
    error = parseUserFacingError(providersState, 'Failed to load providers');
  }

  return {
    providers,
    selectedProvider,
    setSelectedProvider,
    isLoading: providersQuery?.isLoading ?? providersStateIsLoading,
    error,
  };
}

export default useRampsProviders;
