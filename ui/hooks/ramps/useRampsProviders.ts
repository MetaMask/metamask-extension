import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Provider } from '@metamask/ramps-controller';
import {
  selectProviders,
  selectProviderAutoSelected,
  selectTokens,
  selectUserRegion,
} from '../../selectors/rampsController';
import {
  selectRampsProviderForAsset,
  setRampsSelectedPaymentMethod,
  setRampsSelectedProvider,
} from '../../store/controller-actions/ramps-controller';
import { parseUserFacingError } from './utils/parseUserFacingError';
import { rampsQueries } from './queries';
import {
  useProviderPickerOptions,
  usePreviouslyUsedProviderIds,
} from './useProviderPickerOptions';
import { isBuyScreenOwningProviderPick } from './providerPickCoordination';

const EMPTY_PROVIDERS: Provider[] = [];

export type UseRampsProvidersResult = {
  providers: Provider[];
  /**
   * The controller's copy of the provider list, which the pick reads. It can
   * arrive after the React Query copy in `providers`.
   */
  controllerProviders: Provider[];
  /** Ids of the region's providers the user has bought with, most recent first. */
  previouslyUsedProviderIds: string[];
  selectedProvider: Provider | null;
  setSelectedProvider: (
    provider: Provider | null,
    options?: { autoSelected?: boolean; userSelected?: boolean },
  ) => Promise<void>;
  /**
   * Selects the provider for the asset (user pick, ahead-of-history flag list,
   * most recent completed buy, then API ranking) and resolves to its id, or
   * null when none offers it.
   */
  selectProviderForAsset: (assetId: string) => Promise<string | null>;
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
    (
      provider: Provider | null,
      setOptions?: { autoSelected?: boolean; userSelected?: boolean },
    ) => setRampsSelectedProvider(provider?.id ?? null, setOptions),
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

  const pickerOptions = useProviderPickerOptions();
  const previouslyUsedProviderIds = usePreviouslyUsedProviderIds(providers);
  const providerAutoSelected = useSelector(selectProviderAutoSelected);
  const selectedTokenAssetId = useSelector(selectTokens).selected?.assetId;

  const selectProviderForAsset = useCallback(
    (assetId: string) => selectRampsProviderForAsset(assetId, pickerOptions),
    [pickerOptions],
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
    }
  }, [enableSideEffects, providers, selectedProvider, setSelectedProvider]);

  const hasSelectedProvider = Boolean(selectedProvider);

  // Picks when the controller's provider list loads, when the selection is
  // cleared and when order history changes (order sync can finish after
  // start-up). Leaves a selection alone unless the app made it, and leaves the
  // pick to the Buy screen while it is mounted.
  useEffect(() => {
    if (
      !enableSideEffects ||
      !providersStateData?.length ||
      isBuyScreenOwningProviderPick() ||
      (hasSelectedProvider && !providerAutoSelected)
    ) {
      return;
    }
    // A failed pick keeps the current selection; the next trigger picks again.
    selectRampsProviderForAsset(
      selectedTokenAssetId ?? null,
      pickerOptions,
    ).catch(() => undefined);
    // The token is read, not watched: the Buy screen picks on token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enableSideEffects,
    providersStateData,
    previouslyUsedProviderIds,
    hasSelectedProvider,
    pickerOptions,
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
    controllerProviders: providersStateData ?? EMPTY_PROVIDERS,
    previouslyUsedProviderIds,
    selectedProvider,
    setSelectedProvider,
    selectProviderForAsset,
    isLoading: providersQuery?.isLoading ?? providersStateIsLoading,
    error,
  };
}

export default useRampsProviders;
