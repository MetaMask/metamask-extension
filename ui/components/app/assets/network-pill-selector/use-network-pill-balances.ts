import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseCaipChainId } from '@metamask/utils';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  selectAccountGroupBalanceForEmptyState,
  selectAccountGroupBalanceIsLoadedForEmptyState,
  selectIsAssetsLoadingForSelectedAccountGroup,
  selectUnifiedBalanceGetterBySelectedAccountGroup,
} from '../../../../selectors/assets';
import { useAccountGroupBalanceDisplay } from '../account-group-balance-change/useAccountGroupBalanceDisplay';
import { getSelectableChainId } from '../asset-list/asset-list-control-bar/use-home-network-filter';

type EnabledNetworkMap = Record<string, Record<string, boolean>>;

const toEnabledNetworkMap = (
  networks: MultichainNetworkConfiguration[],
): EnabledNetworkMap => {
  const map: EnabledNetworkMap = {};
  networks.forEach((network) => {
    const { namespace } = parseCaipChainId(network.chainId);
    map[namespace] = {
      ...map[namespace],
      [getSelectableChainId(network)]: true,
    };
  });
  return map;
};

/**
 * The selected account group's balance for each of the given networks and for
 * all of them together. Uses the same calculation as the wallet overview
 * balance, so a pill shows the number the overview shows once it is selected.
 *
 * @param networks - The networks to get balances for.
 * @returns The balance of each network keyed by CAIP chain ID, the total of all
 * the networks, and the currency they are in.
 */
export const useNetworkPillBalances = (
  networks: MultichainNetworkConfiguration[],
) => {
  const getBalance = useSelector(
    selectUnifiedBalanceGetterBySelectedAccountGroup,
  );
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const balanceIsLoaded = useSelector(
    selectAccountGroupBalanceIsLoadedForEmptyState,
  );
  const isAssetsLoading = useSelector(
    selectIsAssetsLoadingForSelectedAccountGroup,
  );
  const { isLoading: balanceIsLoading } = useAccountGroupBalanceDisplay('1d');

  // Same check the wallet overview uses to show its loading state.
  const isLoading =
    !hasBalance && (balanceIsLoading || !balanceIsLoaded || isAssetsLoading);

  return useMemo(() => {
    const balanceByChainId: Record<string, number | undefined> = {};
    networks.forEach((network) => {
      balanceByChainId[network.chainId] = isLoading
        ? undefined
        : getBalance(toEnabledNetworkMap([network]))
            ?.totalBalanceInUserCurrency;
    });

    const total = getBalance(toEnabledNetworkMap(networks));

    return {
      balanceByChainId,
      total: isLoading ? undefined : total?.totalBalanceInUserCurrency,
      currency: total?.userCurrency,
    };
  }, [getBalance, isLoading, networks]);
};
