import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Provider } from '@metamask/ramps-controller';
import {
  selectProviders,
  selectRampsOrdersForSelectedAccount,
  selectUserRegion,
} from '../../selectors/rampsController';
import { setRampsSelectedProvider } from '../../store/controller-actions/ramps-controller';
import {
  completedOrdersFromRampsOrders,
  determinePreferredProvider,
} from './utils/determinePreferredProvider';
import { parseUserFacingError } from './utils/parseUserFacingError';
import { rampsQueries } from './queries';

export interface UseRampsProvidersResult {
  providers: Provider[];
  selectedProvider: Provider | null;
  setSelectedProvider: (
    provider: Provider | null,
    options?: { autoSelected?: boolean },
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

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

  const prevRegionRef = useRef(regionCode);
  useEffect(() => {
    if (
      enableSideEffects &&
      regionCode &&
      prevRegionRef.current !== regionCode
    ) {
      prevRegionRef.current = regionCode;
      queryClient.invalidateQueries({
        queryKey: ['ramps'],
        refetchType: 'none',
      });
    }
  }, [enableSideEffects, regionCode, queryClient]);

  const providersQuery = useQuery({
    ...rampsQueries.providers.options({ regionCode }),
    enabled: Boolean(regionCode),
  });

  const providers = useMemo(
    () => providersQuery?.data ?? providersStateData ?? [],
    [providersQuery?.data, providersStateData],
  );

  const controllerOrders = useSelector(selectRampsOrdersForSelectedAccount);
  const completedOrders = useMemo(
    () => completedOrdersFromRampsOrders(controllerOrders),
    [controllerOrders],
  );

  const setSelectedProvider = useCallback(
    (provider: Provider | null, setOptions?: { autoSelected?: boolean }) =>
      setRampsSelectedProvider(provider?.id ?? null, setOptions),
    [],
  );

  useEffect(() => {
    if (
      enableSideEffects &&
      providers &&
      providers.length > 0 &&
      !selectedProvider
    ) {
      const result = determinePreferredProvider(completedOrders, providers);
      if (result) {
        setSelectedProvider(result.provider, {
          autoSelected: result.autoSelected,
        });
      }
    }
  }, [
    enableSideEffects,
    providers,
    selectedProvider,
    completedOrders,
    setSelectedProvider,
  ]);

  let error: string | null = null;
  if (providersQuery?.error != null) {
    error = parseUserFacingError(
      providersQuery.error,
      'Failed to load providers',
    );
  } else if (providersStateError) {
    error = parseUserFacingError(
      providersState,
      'Failed to load providers',
    );
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
