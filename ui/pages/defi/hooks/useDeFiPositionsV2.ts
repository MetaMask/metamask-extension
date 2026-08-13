import { useCallback, useEffect, useMemo, useState } from 'react';
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
  /**
   * True until Redux has an entry for the selected group (including an empty
   * list) or the fetch failed. Derived from store presence — not the messenger
   * promise — so the empty state does not flash between the background write
   * and the UI store update.
   */
  isLoading: boolean;
  /** True when the background fetch failed for the selected account group. */
  isError: boolean;
  /** User-initiated refresh that bypasses the controller cache. */
  refresh: () => Promise<void>;
};

/**
 * Fetches and reads DeFi positions for the selected account group from
 * `DeFiPositionsControllerV2`. Call once per screen (tab or details) — do not
 * also call it from child list components, or you will double-fetch.
 *
 * Must be used under a `RouteWithMessenger` that includes
 * `DeFiPositionsControllerV2:fetchDeFiPositions` (see `DEFI_ROUTE_ALLOWED_CAPABILITIES`).
 *
 * @returns Merged positions plus loading / error / refresh.
 */
export function useDeFiPositionsV2(): UseDeFiPositionsV2Result {
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const groupAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, selectedAccountGroup),
  );
  const positionsByAccount = useSelector(getDeFiPositionsV2);
  const fetchDeFiPositions = useFetchDeFiPositions();

  const accountIds = useMemo(
    () => groupAccounts.map((account) => account.id),
    [groupAccounts],
  );
  // Same signal as the V1 list: `undefined` means not yet written to the UI
  // store (still loading). An empty array means fetched with no positions.
  const hasPositions = accountIds.some(
    (id) => positionsByAccount[id] !== undefined,
  );
  const positions = useMemo(
    () => mergePositionsForAccounts(positionsByAccount, accountIds),
    [positionsByAccount, accountIds],
  );

  // Tie the error to the group that failed so a stale failure cannot suppress
  // loading (or flash the error UI / bounce details home) on the first render
  // after switching to a different group with no cached rows.
  // `null` means "no failure recorded" — never treat that as an error, even when
  // `selectedAccountGroup` is also still null on cold start (`null === null`).
  const [failedAccountGroup, setFailedAccountGroup] = useState<
    typeof selectedAccountGroup | null
  >(null);
  const isError =
    failedAccountGroup !== null && failedAccountGroup === selectedAccountGroup;

  useEffect(() => {
    let cancelled = false;

    setFailedAccountGroup(null);

    fetchDeFiPositions().catch(() => {
      if (!cancelled) {
        setFailedAccountGroup(selectedAccountGroup);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedAccountGroup, fetchDeFiPositions]);

  const refresh = useCallback(async () => {
    setFailedAccountGroup(null);
    try {
      await fetchDeFiPositions({ forceRefresh: true });
    } catch {
      setFailedAccountGroup(selectedAccountGroup);
    }
  }, [fetchDeFiPositions, selectedAccountGroup]);

  return {
    positions,
    isLoading: !hasPositions && !isError,
    isError,
    refresh,
  };
}
