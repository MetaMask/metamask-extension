import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type {
  DeFiPositionDetailsSection,
  DeFiProtocolPositionGroup,
} from '@metamask/assets-controllers';
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
 * Merges details-page sections that share the same `protocolName`, appending
 * positions rather than keeping them as separate adjacent sections.
 *
 * @param existingSections - Sections already collected for this protocol group.
 * @param incomingSections - Sections from another account holding the same
 * protocol, to be merged in.
 * @returns The merged sections, one per distinct `protocolName`.
 */
function mergeSections(
  existingSections: DeFiPositionDetailsSection[],
  incomingSections: DeFiPositionDetailsSection[],
): DeFiPositionDetailsSection[] {
  const byProtocolName = new Map<string, DeFiPositionDetailsSection>(
    existingSections.map((section) => [
      section.protocolName,
      { ...section, positions: [...section.positions] },
    ]),
  );

  for (const section of incomingSections) {
    const existing = byProtocolName.get(section.protocolName);

    if (!existing) {
      byProtocolName.set(section.protocolName, {
        ...section,
        positions: [...section.positions],
      });
      continue;
    }

    existing.positions.push(...section.positions);
  }

  return [...byProtocolName.values()];
}

/**
 * Merges the protocol groups of every account in the selected group into a
 * single flat list, combining groups that share the same chain and protocol.
 *
 * @param positionsByAccount - DeFi positions keyed by internal account ID.
 * @param accountIds - Internal account IDs in the selected account group.
 * @returns The merged protocol groups.
 */
function mergePositionsForAccounts(
  positionsByAccount: Record<string, DeFiProtocolPositionGroup[]>,
  accountIds: string[],
): DeFiProtocolPositionGroup[] {
  const byKey = new Map<string, DeFiProtocolPositionGroup>();

  for (const accountId of accountIds) {
    for (const group of positionsByAccount[accountId] ?? []) {
      const key = `${group.chainId}#${group.protocolId}`;
      const existing = byKey.get(key);

      if (!existing) {
        // Clone so we never mutate the object held in Redux state.
        byKey.set(key, {
          ...group,
          iconGroup: [...group.iconGroup],
          sections: [...group.sections],
        });
        continue;
      }

      existing.marketValue += group.marketValue;
      for (const icon of group.iconGroup) {
        if (!existing.iconGroup.some((item) => item.symbol === icon.symbol)) {
          existing.iconGroup.push(icon);
        }
      }
      existing.sections = mergeSections(existing.sections, group.sections);
    }
  }

  return [...byKey.values()];
}

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
