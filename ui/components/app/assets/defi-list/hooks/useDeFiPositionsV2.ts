import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { V6BalancesResponse } from '@metamask/core-backend';
import {
  buildDeFiBalancesQuery,
  groupDeFiPositionsV6,
  mergePositionsForAccounts,
  type DeFiProtocolPositionGroup,
} from '../../../../../../shared/lib/defi-positions-v2';
import { apiClient } from '../../../../../helpers/api-client';
import { getSelectedCurrency } from '../../../../../selectors/assets';
import { getIsDefiControllerV2Enabled } from '../../../../../selectors/defi-controller-v2/feature-flags';
import { getUseExternalServices } from '../../../../../selectors';
import { getCompletedOnboarding } from '../../../../../ducks/metamask/metamask';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';

type UseDeFiPositionsV2Result = {
  /** Protocol groups for the selected account group, merged across accounts. */
  positions: DeFiProtocolPositionGroup[];
  /** True while the initial fetch is in flight and no positions exist yet. */
  isLoading: boolean;
  /** True when the fetch failed. */
  isError: boolean;
  /**
   * Force-refreshes DeFi positions, bypassing the apiClient TanStack cache
   * (same idea as the former controller `{ forceRefresh: true }`).
   */
  refresh: () => Promise<void>;
};

/**
 * Drives the DeFi tab (V2) without a background controller: fetches v6
 * multiaccount balances through the UI `apiClient` / query client, groups the
 * response, and merges positions across the selected account group.
 *
 * @returns The merged positions plus loading/error/refresh helpers.
 */
export function useDeFiPositionsV2(): UseDeFiPositionsV2Result {
  const queryClient = useQueryClient();
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const groupAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, selectedAccountGroup),
  );
  const vsCurrency = useSelector(getSelectedCurrency);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const useExternalServices = useSelector(getUseExternalServices);
  const isDefiControllerV2Enabled = useSelector(getIsDefiControllerV2Enabled);

  const isEnabled =
    Boolean(completedOnboarding) &&
    Boolean(useExternalServices) &&
    isDefiControllerV2Enabled;

  const internalAccountIds = useMemo(
    () => groupAccounts.map((account) => account.id),
    [groupAccounts],
  );

  const { networks, internalAccountIdByCaip, accountIds } = useMemo(() => {
    const query = buildDeFiBalancesQuery(groupAccounts);
    return {
      networks: query.networks,
      internalAccountIdByCaip: query.internalAccountIdByCaip,
      accountIds: [...query.internalAccountIdByCaip.keys()],
    };
  }, [groupAccounts]);

  const normalizedVsCurrency = vsCurrency.toLowerCase();

  const balancesQueryOptions =
    apiClient.accounts.getV6MultiAccountBalancesQueryOptions(accountIds, {
      networks,
      includeDeFiBalances: true,
      forceFetchDeFiPositions: true,
      includePrices: true,
      vsCurrency: normalizedVsCurrency,
    });

  const {
    data: positions = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    ...balancesQueryOptions,
    // @ts-expect-error apiClient returns v5 types, repo still on react-query v4
    enabled: isEnabled && accountIds.length > 0 && networks.length > 0,
    select: (response: V6BalancesResponse): DeFiProtocolPositionGroup[] => {
      const readyAccounts = response.accounts.filter(
        (account) => !account.processingDefiPositions,
      );
      if (readyAccounts.length === 0) {
        return [];
      }

      const positionsByAccount = groupDeFiPositionsV6(
        { ...response, accounts: readyAccounts },
        internalAccountIdByCaip,
      );

      return mergePositionsForAccounts(positionsByAccount, internalAccountIds);
    },
  });

  const refresh = useCallback(async () => {
    if (!isEnabled || accountIds.length === 0 || networks.length === 0) {
      return;
    }

    await queryClient.fetchQuery({
      ...apiClient.accounts.getV6MultiAccountBalancesQueryOptions(
        accountIds,
        {
          networks,
          includeDeFiBalances: true,
          forceFetchDeFiPositions: true,
          includePrices: true,
          vsCurrency: normalizedVsCurrency,
        },
        { staleTime: 0 },
      ),
    });
  }, [accountIds, isEnabled, networks, normalizedVsCurrency, queryClient]);

  return {
    positions,
    isLoading: (isLoading || isFetching) && positions.length === 0,
    isError,
    refresh,
  };
}
