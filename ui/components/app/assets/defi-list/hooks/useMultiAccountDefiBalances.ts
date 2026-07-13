import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { V6BalancesResponse } from '@metamask/core-backend';
import {
  buildMultiAccountBalancesQuery,
  getMultiAccountBalancesV6ApiParams,
} from '../../../../../../shared/lib/defi-controller-v2/multiaccount-balances-query';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';
import { selectEnabledNetworksAsCaipChainIds } from '../../../../../selectors/multichain/networks';
import { getUseExternalServices } from '../../../../../selectors';
import { apiClient } from '../../../../../helpers/api-client';

export function useMultiAccountDefiBalances() {
  const useExternalServices = useSelector(getUseExternalServices);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const groupAccounts = useSelector((state) =>
    getInternalAccountsFromGroupById(state, selectedAccountGroup),
  );
  const enabledCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);

  const selectedAccountAddress = useMemo(() => {
    const evmAccount = groupAccounts.find((account) =>
      isEvmAccountType(account.type),
    );
    return evmAccount?.address;
  }, [groupAccounts]);

  const balancesQuery = useMemo(
    () => buildMultiAccountBalancesQuery(groupAccounts, enabledCaipChainIds),
    [groupAccounts, enabledCaipChainIds],
  );

  const apiParams = useMemo(
    () => getMultiAccountBalancesV6ApiParams(balancesQuery),
    [balancesQuery],
  );

  const queryOptions = useMemo(
    () =>
      apiClient.accounts.getV6MultiAccountBalancesQueryOptions(
        apiParams.accountIds,
        {
          networks: apiParams.networks,
          includeDeFiBalances: apiParams.includeDeFiBalances,
          forceFetchDeFiPositions: apiParams.forceFetchDeFiPositions,
          includePrices: apiParams.includePrices,
          vsCurrency: apiParams.vsCurrency,
        },
      ),
    [apiParams],
  );

  const query = useQuery({
    ...queryOptions,
    enabled:
      Boolean(useExternalServices) &&
      apiParams.accountIds.length > 0 &&
      apiParams.networks.length > 0,
  });

  return {
    ...query,
    data: query.data as V6BalancesResponse | undefined,
    selectedAccountGroup,
    selectedAccountAddress,
    balancesQuery,
    apiParams,
  };
}
