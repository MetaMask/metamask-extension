import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseCaipChainId } from '@metamask/utils';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import type { Asset } from '@metamask/assets-controllers';
import {
  getAssetsBySelectedAccountGroup,
  selectAccountGroupBalanceForEmptyState,
  selectAccountGroupBalanceIsLoadedForEmptyState,
  selectIsAssetsLoadingForSelectedAccountGroup,
  selectUnifiedBalanceGetterBySelectedAccountGroup,
} from '../../../selectors/assets';
import {
  liveFiatDelta,
  useLiveAssetPrices,
} from '../../../hooks/assets/market-stats-live-prices';
import { useAccountGroupBalanceDisplay } from '../../app/assets/account-group-balance-change/useAccountGroupBalanceDisplay';
import { getSelectableChainId } from '../../app/assets/asset-list/asset-list-control-bar/use-home-network-filter';
import { toCaipAssetId } from '../../app/assets/util/to-caip-asset-id';

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
 * Streamed prices adjust each polled balance, as they do for the overview.
 *
 * @param networks - The networks to get balances for.
 * @returns The balance of each network keyed by CAIP chain ID, the total of all
 * networks, their currency, and whether the balances are still loading.
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
  const assetsByChain = useSelector(getAssetsBySelectedAccountGroup);
  const livePrices = useLiveAssetPrices();

  // Same check the wallet overview uses to show its loading state.
  const isLoading =
    !hasBalance && (balanceIsLoading || !balanceIsLoaded || isAssetsLoading);

  return useMemo(() => {
    const getLiveDelta = (network: MultichainNetworkConfiguration) =>
      liveFiatDelta(
        (assetsByChain?.[getSelectableChainId(network)] ?? []) as Asset[],
        livePrices,
        toCaipAssetId,
      );

    const balanceByChainId: Record<string, number | undefined> = {};
    let totalDelta = 0;
    networks.forEach((network) => {
      const delta = getLiveDelta(network);
      totalDelta += delta;
      const polled = isLoading
        ? undefined
        : getBalance(toEnabledNetworkMap([network]))
            ?.totalBalanceInUserCurrency;
      balanceByChainId[network.chainId] =
        polled === undefined ? undefined : polled + delta;
    });

    const total = getBalance(toEnabledNetworkMap(networks));
    const polledTotal = total?.totalBalanceInUserCurrency;

    return {
      balanceByChainId,
      total:
        isLoading || polledTotal === undefined
          ? undefined
          : polledTotal + totalDelta,
      currency: total?.userCurrency,
      isLoading,
    };
  }, [assetsByChain, getBalance, isLoading, livePrices, networks]);
};
