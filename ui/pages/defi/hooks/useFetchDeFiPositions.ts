import { useCallback } from 'react';
import { useMessenger } from '../../../hooks/useMessenger';
import type { DeFiMessenger } from '../messenger';

export type FetchDeFiPositionsOptions = {
  /**
   * When true, bypass the apiClient cache and fetch immediately
   * (e.g. user-initiated refresh).
   */
  forceRefresh?: boolean;
};

/**
 * Returns a function that asks `DeFiPositionsControllerV2` to fetch DeFi
 * positions for the selected account group.
 *
 * Must be used under a `RouteMessengerProvider` that includes
 * `DeFiPositionsControllerV2:fetchDeFiPositions` in its capabilities (see
 * `DEFI_ROUTE_ALLOWED_CAPABILITIES` in `../messenger`).
 *
 * @returns A stable callback that triggers a DeFi positions fetch.
 */
export function useFetchDeFiPositions(): (
  options?: FetchDeFiPositionsOptions,
) => Promise<void> {
  const messenger = useMessenger<DeFiMessenger>();

  return useCallback(
    async (options?: FetchDeFiPositionsOptions) => {
      await messenger.call(
        'DeFiPositionsControllerV2:fetchDeFiPositions',
        options,
      );
    },
    [messenger],
  );
}
