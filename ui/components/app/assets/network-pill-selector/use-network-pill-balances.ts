import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseCaipChainId } from '@metamask/utils';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { selectUnifiedBalanceGetterBySelectedAccountGroup } from '../../../../selectors/assets';
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

  return useMemo(() => {
    const balanceByChainId: Record<string, number> = {};
    networks.forEach((network) => {
      balanceByChainId[network.chainId] =
        getBalance(toEnabledNetworkMap([network]))
          ?.totalBalanceInUserCurrency ?? 0;
    });

    const total = getBalance(toEnabledNetworkMap(networks));

    return {
      balanceByChainId,
      total: total?.totalBalanceInUserCurrency ?? 0,
      currency: total?.userCurrency,
    };
  }, [getBalance, networks]);
};
