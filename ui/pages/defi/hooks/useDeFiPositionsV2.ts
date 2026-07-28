import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { mergePositionsForAccounts } from '@metamask/assets-controllers';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import { getDeFiPositionsV2 } from '../../../selectors/defi-controller-v2/positions';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { useFetchDeFiPositions } from './useFetchDeFiPositions';

export type UseDeFiPositionsV2Result = {
  /** Protocol groups for the selected account group, merged across accounts. */
  positions: DeFiProtocolPositionGroup[];
  /** True while the initial fetch is in flight and no positions exist yet. */
  isLoading: boolean;
  /** True when the background fetch failed. */
  isError: boolean;
  /** User-initiated refresh that bypasses the controller cache. */
  refresh: () => Promise<void>;
};

export type UseDeFiPositionsV2Options = {
  /**
   * When false, skips the mount / account-group fetch. Defaults to true.
   * Use to gate V2 fetches while the V1 list is still shown.
   */
  enabled?: boolean;
};

/**
 * Fetches and reads DeFi positions for the selected account group from
 * `DeFiPositionsControllerV2`. Call once per screen (tab or details) — do not
 * also call it from child list components, or you will double-fetch.
 *
 * Must be used under a `RouteWithMessenger` that includes
 * `DeFiPositionsControllerV2:fetchDeFiPositions` (see `DEFI_ROUTE_ALLOWED_CAPABILITIES`).
 *
 * @param options - Optional fetch controls.
 * @param options.enabled - When false, does not auto-fetch. Defaults to true.
 * @returns Merged positions plus loading / error / refresh.
 */
export function useDeFiPositionsV2(
  options: UseDeFiPositionsV2Options = {},
): UseDeFiPositionsV2Result {
  const { enabled = true } = options;
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const groupAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, selectedAccountGroup),
  );
  const positionsByAccount = useSelector(getDeFiPositionsV2);
  const fetchDeFiPositions = useFetchDeFiPositions();

  const accountIds = groupAccounts.map((account) => account.id);
  const hasPositions = accountIds.some(
    (id) => positionsByAccount[id] !== undefined,
  );
  const positions = mergePositionsForAccounts(positionsByAccount, accountIds);

  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    setIsFetching(true);
    setIsError(false);

    fetchDeFiPositions()
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, selectedAccountGroup, fetchDeFiPositions]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsError(false);
    try {
      await fetchDeFiPositions({ forceRefresh: true });
    } catch {
      setIsError(true);
    }
  }, [enabled, fetchDeFiPositions]);

  return {
    positions,
    isLoading: enabled && isFetching && !hasPositions,
    isError: enabled && isError,
    refresh,
  };
}
