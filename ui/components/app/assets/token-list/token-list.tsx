import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
  isStrictHexString,
} from '@metamask/utils';
import type { Asset } from '@metamask/assets-controllers';
import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useTokenAssetSecurityResults } from '#ui/hooks/token-asset/useTokenAssetSecurityResults';
import {
  getNativeAssetId,
  isEvmChainId,
  isTronSpecialAsset,
  normalizeTokenAssetId,
} from '#shared/lib/asset-utils';
import { buildEvmCaip19AssetId } from '#shared/lib/multichain/buildEvmCaip19AssetId';
import { useLowValueTokenPartition } from '#ui/components/app/assets/hooks/useLowValueTokenPartition';
import TokenCell from '../token-cell';
import { ASSET_CELL_HEIGHT } from '../constants';
import {
  getShouldHideZeroBalanceTokens,
  getTokenSortConfig,
  getUseExternalServices,
} from '../../../../selectors';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { type TokenWithFiatAmount } from '../types';
import {
  getSelectedMultichainNetworkConfiguration,
  getIsEvmMultichainNetworkSelected,
  getAllEnabledNetworksForAllNamespaces,
} from '../../../../selectors/multichain/networks';
import {
  getAssetsBySelectedAccountGroup,
  selectAccountGroupBalanceForEmptyState,
} from '../../../../selectors/assets';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { sortAssetsWithPriority } from '../util/sortAssetsWithPriority';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import { TOKEN_LIST_CELL_MUSD_OPTIONS } from '../../musd/musd-events';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useBoolean } from '../../../../hooks/useBoolean';
import { useRWAToken } from '../../../../pages/bridge/hooks/useRWAToken';

type TokenListProps = {
  onTokenClick: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  safeChains?: SafeChain[];
};

type TokenListDisplayItem =
  | {
      type: 'token';
      token: TokenWithFiatAmount;
    }
  | {
      type: 'low-value-toggle';
      count: number;
    };


const toCaipAssetId = (asset: Asset): CaipAssetType | undefined => {
  const { assetId, chainId, isNative } = asset;

  if (assetId && isCaipAssetType(assetId)) {
    return normalizeTokenAssetId(assetId);
  }

  if (isNative) {
    const nativeAssetId = getNativeAssetId(chainId as Hex | undefined);
    return nativeAssetId ? normalizeTokenAssetId(nativeAssetId) : undefined;
  }

  const evmAddress = 'address' in asset ? asset.address : assetId;
  if (evmAddress && isStrictHexString(chainId)) {
    return buildEvmCaip19AssetId(evmAddress, chainId) as CaipAssetType;
  }

  return undefined;
};

const getTokenListItemKey = (item: TokenListDisplayItem, index: number) => {
  if (item.type === 'low-value-toggle') {
    return `low-value-assets-toggle-${index}`;
  }

  return `${item.token.chainId}-${item.token.symbol}-${item.token.address}`;
};

const LowValueAssetsToggle = ({
  count,
  isExpanded,
  onClick,
}: {
  count: number;
  isExpanded: boolean;
  onClick: () => void;
}) => {
  const t = useI18nContext();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center bg-background-default px-4 text-start text-inherit hover:bg-hover focus:outline-none"
      style={{ height: ASSET_CELL_HEIGHT }}
      aria-expanded={isExpanded}
      data-testid="low-value-assets-toggle"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="min-w-0"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
          ellipsis
        >
          {t('lowValueAssets', [count])}
        </Text>
        <Box marginLeft={1} className="flex-shrink-0">
          <Icon
            name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
      </Box>
    </button>
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function TokenList({ onTokenClick, safeChains }: TokenListProps) {
  const isEvm = useSelector(getIsEvmMultichainNetworkSelected);
  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const { privacyMode } = useSelector(getPreferences);
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { value: isLowValueAssetsExpanded, toggle: toggleLowValueAssets } =
    useBoolean();
  const { isStockToken } = useRWAToken();

  const accountGroupIdAssets = useSelector(getAssetsBySelectedAccountGroup);

  // Defer only the hide-zero-balance preference so Settings toggles stay
  // responsive while this list recomputes. Account assets must update
  // immediately on account switch to avoid showing stale tokens.
  const deferredShouldHideZeroBalanceTokens = useDeferredValue(
    shouldHideZeroBalanceTokens,
  );

  const useExternalServices = useSelector(getUseExternalServices);

  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );

  const sortedFilteredTokens = useMemo(() => {
    const accountAssetsPreSort = Object.entries(accountGroupIdAssets).flatMap(
      ([chainId, assets]) => {
        if (!allEnabledNetworksForAllNamespaces.includes(chainId)) {
          return [];
        }

        // Mapping necessary to comply with the type. Fields will be overriden with useTokenDisplayInfo
        return assets.filter((asset) => {
          if (isTronSpecialAsset(asset.assetId)) {
            return false;
          }
          if (deferredShouldHideZeroBalanceTokens && asset.balance === '0') {
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

    // Filter out non-EVM assets when basic functionality toggle is OFF
    // Exception: Keep assets for the currently selected non-EVM chain
    const finalAccountAssets = useExternalServices
      ? accountAssets
      : accountAssets.filter(
          (asset) =>
            isEvmChainId(asset.chainId) ||
            (!isEvm && asset.chainId === currentNetwork.chainId),
        );

    return finalAccountAssets.map((asset) => {
      const token: TokenWithFiatAmount = {
        ...asset,
        tokenFiatAmount: asset.fiat?.balance,
        secondary: null,
        title: asset.name,
        address: 'address' in asset ? asset.address : (asset.assetId as Hex),
        chainId: asset.chainId as Hex,
        caipAssetId: toCaipAssetId(asset),
      };

      return token;
    });
  }, [
    isEvm,
    currentNetwork.chainId,
    tokenSortConfig,
    accountGroupIdAssets,
    allEnabledNetworksForAllNamespaces,
    deferredShouldHideZeroBalanceTokens,
    useExternalServices,
  ]);

  // Low value collapse only applies to declining-balance sort.
  const shouldPartitionLowValueTokens =
    tokenSortConfig?.key === 'tokenFiatAmount' &&
    tokenSortConfig?.order === 'dsc' &&
    tokenSortConfig?.sortCallback === 'stringNumeric';
  const { visibleTokens, lowValueTokens } = useLowValueTokenPartition({
    tokens: sortedFilteredTokens,
    enabled: shouldPartitionLowValueTokens,
  });

  const lowValueAssetCount = lowValueTokens.length;

  const displayedAssetIds = useMemo(
    () =>
      [
        ...visibleTokens,
        ...(isLowValueAssetsExpanded ? lowValueTokens : []),
      ].flatMap((token) =>
        token.caipAssetId && !isStockToken(token) ? [token.caipAssetId] : [],
      ),
    [isLowValueAssetsExpanded, isStockToken, lowValueTokens, visibleTokens],
  );

  const deferredDisplayedAssetIds = useDeferredValue(displayedAssetIds);

  const securityResultByAssetId = useTokenAssetSecurityResults({
    assetIds: deferredDisplayedAssetIds,
  });

  const tokenListItems = useMemo<TokenListDisplayItem[]>(() => {
    const visibleTokenItems: TokenListDisplayItem[] = visibleTokens.map(
      (token) => ({
        type: 'token',
        token: {
          ...token,
          safetyResult: token.caipAssetId
            ? securityResultByAssetId[token.caipAssetId]
            : undefined,
        },
      }),
    );

    if (lowValueAssetCount === 0) {
      return visibleTokenItems;
    }

    return [
      ...visibleTokenItems,
      {
        type: 'low-value-toggle',
        count: lowValueAssetCount,
      },
      ...(isLowValueAssetsExpanded
        ? lowValueTokens.map((token) => ({
            type: 'token' as const,
            token: {
              ...token,
              safetyResult: token.caipAssetId
                ? securityResultByAssetId[token.caipAssetId]
                : undefined,
            },
          }))
        : []),
    ];
  }, [
    isLowValueAssetsExpanded,
    lowValueAssetCount,
    lowValueTokens,
    securityResultByAssetId,
    visibleTokens,
  ]);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  const handleTokenClick = useCallback(
    (token: TokenWithFiatAmount) => () => {
      // Ensure token has a valid chainId before proceeding
      if (!token.chainId) {
        return;
      }

      // TODO BIP44 Refactor: The route requires evm native tokens to not pass the address
      const tokenAddress =
        isEvmChainId(token.chainId) && token.isNative ? '' : token.address;

      const routeAssetId =
        token.assetId && isCaipAssetType(token.assetId)
          ? token.assetId
          : undefined;

      onTokenClick(token.chainId, tokenAddress, routeAssetId);

      // Track event: token details
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TokenDetailsOpened)
          .addCategory(MetaMetricsEventCategory.Tokens)
          .addProperties({
            location: 'Home',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_symbol: token.symbol ?? 'unknown',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: token.chainId,
          })
          .build(),
      );
    },
    [createEventBuilder, onTokenClick, trackEvent],
  );

  const handleLowValueAssetsToggle = useCallback(() => {
    toggleLowValueAssets();

    trackEvent(
      createEventBuilder(MetaMetricsEventName.LowValueAssetsToggled)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          state: isLowValueAssetsExpanded ? 'collapsed' : 'expanded',
          count: lowValueAssetCount,
        })
        .build(),
    );
  }, [
    createEventBuilder,
    isLowValueAssetsExpanded,
    lowValueAssetCount,
    toggleLowValueAssets,
    trackEvent,
  ]);

  const renderTokenListItem = useCallback(
    (info: { item: TokenListDisplayItem }) => {
      const { item } = info;
      if (item.type === 'low-value-toggle') {
        return (
          <LowValueAssetsToggle
            count={item.count}
            isExpanded={isLowValueAssetsExpanded}
            onClick={handleLowValueAssetsToggle}
          />
        );
      }

      const { token } = item;
      const isNonEvmTestnet = NON_EVM_TESTNET_IDS.includes(
        token.chainId as CaipChainId,
      );

      return (
        <TokenCell
          token={token}
          privacyMode={privacyMode}
          onClick={isNonEvmTestnet ? undefined : handleTokenClick(token)}
          safeChains={safeChains}
          musd={TOKEN_LIST_CELL_MUSD_OPTIONS}
        />
      );
    },
    [
      handleLowValueAssetsToggle,
      handleTokenClick,
      isLowValueAssetsExpanded,
      privacyMode,
      safeChains,
    ],
  );

  // Disable virtualization when empty balance state is shown
  if (!hasBalance) {
    return (
      <div className="token-list-non-virtualized">
        {tokenListItems.map((item, index) => (
          <div key={getTokenListItemKey(item, index)}>
            {renderTokenListItem({ item })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <VirtualizedList
      data={tokenListItems}
      estimatedItemSize={ASSET_CELL_HEIGHT}
      overscan={10}
      keyExtractor={getTokenListItemKey}
      renderItem={renderTokenListItem}
    />
  );
}

export default React.memo(TokenList);
