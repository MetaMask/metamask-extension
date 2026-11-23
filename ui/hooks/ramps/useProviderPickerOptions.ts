import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getPreviouslyUsedProviders,
  type Provider,
  type SelectProviderForAssetOptions,
} from '@metamask/ramps-controller';
import { getRampsProvidersAheadOfHistory } from '../../selectors/ramps-feature-flags';
import { selectRampsOrders } from '../../selectors/rampsController';

/**
 * Inputs for `RampsController.selectProviderForAsset`.
 *
 * @returns Stable picker options.
 */
export function useProviderPickerOptions(): SelectProviderForAssetOptions {
  const aheadOfHistory = useSelector(getRampsProvidersAheadOfHistory);
  return useMemo(() => ({ aheadOfHistory }), [aheadOfHistory]);
}

/**
 * Ids of the given providers that the user has completed a buy with on any
 * account, most recent first. Reads the same history as the pre-selection, so
 * the "Previously used" tag and the pick agree. The result only changes when
 * the list of ids does, not on every order status update.
 *
 * @param providers - Providers for the current region.
 * @returns Stable list of previously used provider ids.
 */
export function usePreviouslyUsedProviderIds(providers: Provider[]): string[] {
  const orders = useSelector(selectRampsOrders);
  const key = useMemo(
    () =>
      getPreviouslyUsedProviders({ providers, orders })
        .map((provider) => provider.id)
        .join(','),
    [providers, orders],
  );
  return useMemo(() => (key ? key.split(',') : []), [key]);
}
