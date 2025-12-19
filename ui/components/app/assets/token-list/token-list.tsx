import React, { useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type CaipChainId, type Hex } from '@metamask/utils';
import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { useVirtualizer } from '@tanstack/react-virtual';
import TokenCell from '../token-cell';
import { ASSET_CELL_HEIGHT } from '../constants';
import {
  getEnabledNetworksByNamespace,
  getIsMultichainAccountsState2Enabled,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenSortConfig,
} from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useNetworkFilter } from '../hooks';
import { type TokenWithFiatAmount } from '../types';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import useMultiChainAssets from '../hooks/useMultichainAssets';
import {
  getSelectedMultichainNetworkConfiguration,
  getIsEvmMultichainNetworkSelected,
  getAllEnabledNetworksForAllNamespaces,
} from '../../../../selectors/multichain/networks';
import {
  getAssetsBySelectedAccountGroup,
  getTokenBalancesEvm,
  selectAccountGroupBalanceForEmptyState,
} from '../../../../selectors/assets';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { SafeChain } from '../../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import { isGlobalNetworkSelectorRemoved } from '../../../../selectors/selectors';
import {
  isEvmChainId,
  isTronResource,
} from '../../../../../shared/lib/asset-utils';
import { sortAssetsWithPriority } from '../util/sortAssetsWithPriority';
import { useScrollContainer } from '../../../../contexts/scroll-container';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  safeChains?: SafeChain[];
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function TokenList({ onTokenClick, safeChains }: TokenListProps) {
  const scrollContainerRef = useScrollContainer();
  const isEvm = useSelector(getIsEvmMultichainNetworkSelected);
  const newTokensImported = useSelector(getNewTokensImported);
  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const { privacyMode } = useSelector(getPreferences);
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount.address),
  );
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const trackEvent = useContext(MetaMetricsContext);

  const accountGroupIdAssets = useSelector(getAssetsBySelectedAccountGroup);

  const multichainAssets = useMultiChainAssets();

  // network filter to determine which tokens to show in list
  // on EVM we want to filter based on network filter controls, on non-evm we only want tokens from that chain identifier
  const { networkFilter } = useNetworkFilter();
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const networksToShow = useMemo(() => {
    return isGlobalNetworkSelectorRemoved
      ? enabledNetworksByNamespace
      : networkFilter;
  }, [enabledNetworksByNamespace, networkFilter]);

  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );

  const sortedFilteredTokens = useMemo(() => {
    if (!isMultichainAccountsState2Enabled) {
      const balances = isEvm ? evmBalances : multichainAssets;
      const filteredAssets = filterAssets(balances as TokenWithFiatAmount[], [
        {
          key: 'chainId',
          opts: isEvm ? networksToShow : { [currentNetwork.chainId]: true },
          filterCallback: 'inclusive',
        },
      ]);

      return sortAssets([...filteredAssets], tokenSortConfig);
    }

    const accountAssetsPreSort = Object.entries(accountGroupIdAssets).flatMap(
      ([chainId, assets]) => {
        if (!allEnabledNetworksForAllNamespaces.includes(chainId)) {
          return [];
        }

        // Mapping necessary to comply with the type. Fields will be overriden with useTokenDisplayInfo
        return assets.filter((asset) => {
          if (isTronResource(asset)) {
            return false;
          }
          if (shouldHideZeroBalanceTokens && asset.balance === '0') {
            return false;
          }
          return true;
        });
      },
    );

    const accountAssets = sortAssetsWithPriority(
      accountAssetsPreSort,
      tokenSortConfig,
    );

    return accountAssets.map((asset) => {
      const token: TokenWithFiatAmount = {
        ...asset,
        tokenFiatAmount: asset.fiat?.balance,
        secondary: null,
        title: asset.name,
        address: 'address' in asset ? asset.address : (asset.assetId as Hex),
        chainId: asset.chainId as Hex,
      };

      return token;
    });
  }, [
    isEvm,
    evmBalances,
    multichainAssets,
    networksToShow,
    currentNetwork.chainId,
    tokenSortConfig,
    isMultichainAccountsState2Enabled,
    accountGroupIdAssets,
    // newTokensImported included in deps, but not in hook's logic
    newTokensImported,
    allEnabledNetworksForAllNamespaces,
  ]);

  const virtualizer = useVirtualizer({
    count: sortedFilteredTokens.length,
    getScrollElement: () => scrollContainerRef?.current || null,
    estimateSize: () => ASSET_CELL_HEIGHT,
    overscan: 10,
    initialOffset: scrollContainerRef?.current?.scrollTop,
  });

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  const handleTokenClick = (token: TokenWithFiatAmount) => () => {
    // Ensure token has a valid chainId before proceeding
    if (!token.chainId) {
      return;
    }

    // TODO BIP44 Refactor: The route requires evm native tokens to not pass the address
    const tokenAddress =
      isEvmChainId(token.chainId) && token.isNative ? '' : token.address;

    onTokenClick(token.chainId, tokenAddress);

    // Track event: token details
    trackEvent({
      category: MetaMetricsEventCategory.Tokens,
      event: MetaMetricsEventName.TokenDetailsOpened,
      properties: {
        location: 'Home',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: token.symbol ?? 'unknown',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: token.chainId,
      },
    });
  };

  // Disable virtualization when empty balance state is shown
  if (!hasBalance) {
    return (
      <div className="token-list-non-virtualized">
        {sortedFilteredTokens.map((token) => {
          const isNonEvmTestnet = NON_EVM_TESTNET_IDS.includes(
            token.chainId as CaipChainId,
          );

          return (
            <TokenCell
              key={`${token.chainId}-${token.symbol}-${token.address}`}
              token={token}
              privacyMode={privacyMode}
              onClick={isNonEvmTestnet ? undefined : handleTokenClick(token)}
              safeChains={safeChains}
            />
          );
        })}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className="relative w-full"
      style={{
        height: `${virtualizer.getTotalSize()}px`,
      }}
    >
      {virtualItems.map((virtualItem) => {
        const token = sortedFilteredTokens[virtualItem.index];
        const isNonEvmTestnet = NON_EVM_TESTNET_IDS.includes(
          token.chainId as CaipChainId,
        );

        return (
          <div
            key={`${token.chainId}-${token.symbol}-${token.address}`}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TokenCell
              token={token}
              privacyMode={privacyMode}
              onClick={isNonEvmTestnet ? undefined : handleTokenClick(token)}
              safeChains={safeChains}
            />
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(TokenList);
