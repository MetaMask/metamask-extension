import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { mergePositionsForAccounts } from '@metamask/assets-controllers';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import { getDeFiPositionsV2 } from '../../../../../selectors/defi-controller-v2/positions';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';
import { fetchDeFiPositions } from '../../../../../hooks/defi/defiActions';

type UseDeFiPositionsV2Result = {
  /** Protocol groups for the selected account group, merged across accounts. */
  positions: DeFiProtocolPositionGroup[];
  /** True while the initial fetch is in flight and no positions exist yet. */
  isLoading: boolean;
  /** True when the background fetch failed. */
  isError: boolean;
};

/**
 * Drives the DeFi tab (V2): dispatches a fetch to `DeFiPositionsControllerV2`
 * when the user enters the tab (and whenever the selected account group
 * changes), then reads the resulting positions straight from Redux state.
 *
 * @returns The merged positions plus loading/error flags.
 */
export function useDeFiPositionsV2(): UseDeFiPositionsV2Result {
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const groupAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, selectedAccountGroup),
  );
  const positionsByAccount = useSelector(getDeFiPositionsV2);
  const accountIds = useMemo(
    () => groupAccounts.map((account) => account.id),
    [groupAccounts],
  );

  const hasPositions = useMemo(
    () => accountIds.some((id) => positionsByAccount[id] !== undefined),
    [accountIds, positionsByAccount],
  );

  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
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
  }, [selectedAccountGroup]);

  const positions = useMemo(
    () => mergePositionsForAccounts(positionsByAccount, accountIds),
    [positionsByAccount, accountIds],
  );

  return {
    positions,
    isLoading: isFetching && !hasPositions,
    isError,
  };
}
