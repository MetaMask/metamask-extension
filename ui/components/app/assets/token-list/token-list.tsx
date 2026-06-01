import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { type CaipChainId, type Hex } from '@metamask/utils';
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
import TokenCell from '../token-cell';
import { ASSET_CELL_HEIGHT } from '../constants';
import {
  getCurrencyRates,
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
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import {
  isEvmChainId,
  isTronSpecialAsset,
} from '../../../../../shared/lib/asset-utils';
import { sortAssetsWithPriority } from '../util/sortAssetsWithPriority';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import { isMusdToken } from '../../musd/constants';
import { TOKEN_LIST_CELL_MUSD_OPTIONS } from '../../musd/musd-events';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
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

const LOW_VALUE_ASSET_FIAT_THRESHOLD = 1;
let lowValueAssetsExpandedSessionValue = false;

type CurrencyRate = {
  conversionRate?: number | null;
  usdConversionRate?: number | null;
};

type CurrencyRates = Record<string, CurrencyRate>;

const getInitialLowValueAssetsExpanded = () => {
  return lowValueAssetsExpandedSessionValue;
};

const setLowValueAssetsExpandedSessionValue = (isExpanded: boolean) => {
  lowValueAssetsExpandedSessionValue = isExpanded;
};

const getLowValueAssetFiatThreshold = (currencyRates?: CurrencyRates) => {
  const currencyRate = Object.values(currencyRates ?? {}).find(
    ({ conversionRate, usdConversionRate }) =>
      typeof conversionRate === 'number' &&
      typeof usdConversionRate === 'number' &&
      Number.isFinite(conversionRate) &&
      Number.isFinite(usdConversionRate) &&
      conversionRate > 0 &&
      usdConversionRate > 0,
  );

  if (!currencyRate?.conversionRate || !currencyRate.usdConversionRate) {
    return LOW_VALUE_ASSET_FIAT_THRESHOLD;
  }

  return (
    (LOW_VALUE_ASSET_FIAT_THRESHOLD * currencyRate.conversionRate) /
    currencyRate.usdConversionRate
  );
};

const isLowValueAsset = (
  token: TokenWithFiatAmount,
  lowValueAssetFiatThreshold: number,
) => {
  const { tokenFiatAmount } = token;

  return (
    !token.isNative &&
    !isMusdToken(token.address) &&
    tokenFiatAmount !== null &&
    tokenFiatAmount !== undefined &&
    Number.isFinite(tokenFiatAmount) &&
    tokenFiatAmount < lowValueAssetFiatThreshold
  );
};

const isDecliningBalanceSort = (
  tokenSortConfig: ReturnType<typeof getTokenSortConfig>,
) =>
  tokenSortConfig?.key === 'tokenFiatAmount' &&
  tokenSortConfig?.order === 'dsc' &&
  tokenSortConfig?.sortCallback === 'stringNumeric';

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
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRates;
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const hasBalance = useSelector(selectAccountGroupBalanceForEmptyState);
  const { trackEvent } = useContext(MetaMetricsContext);
  const [isLowValueAssetsExpanded, setIsLowValueAssetsExpanded] = useState(
    getInitialLowValueAssetsExpanded,
  );

  const accountGroupIdAssets = useSelector(getAssetsBySelectedAccountGroup);

  const useExternalServices = useSelector(getUseExternalServices);
  const lowValueAssetFiatThreshold = useMemo(
    () => getLowValueAssetFiatThreshold(currencyRates),
    [currencyRates],
  );

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
      };

      return token;
    });
  }, [
    isEvm,
    currentNetwork.chainId,
    tokenSortConfig,
    accountGroupIdAssets,
    allEnabledNetworksForAllNamespaces,
    shouldHideZeroBalanceTokens,
    useExternalServices,
  ]);

  const { visibleTokens, lowValueTokens } = useMemo(() => {
    if (!isDecliningBalanceSort(tokenSortConfig)) {
      return {
        visibleTokens: sortedFilteredTokens,
        lowValueTokens: [],
      };
    }

    const highValueTokens: TokenWithFiatAmount[] = [];
    const lowValueAssets: TokenWithFiatAmount[] = [];

    sortedFilteredTokens.forEach((token) => {
      if (isLowValueAsset(token, lowValueAssetFiatThreshold)) {
        lowValueAssets.push(token);
        return;
      }
      highValueTokens.push(token);
    });

    return {
      visibleTokens: highValueTokens,
      lowValueTokens: lowValueAssets,
    };
  }, [lowValueAssetFiatThreshold, sortedFilteredTokens, tokenSortConfig]);

  const lowValueAssetCount = lowValueTokens.length;

  const tokenListItems = useMemo<TokenListDisplayItem[]>(() => {
    const visibleTokenItems: TokenListDisplayItem[] = visibleTokens.map(
      (token) => ({
        type: 'token',
        token,
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
            token,
          }))
        : []),
    ];
  }, [
    isLowValueAssetsExpanded,
    lowValueAssetCount,
    lowValueTokens,
    visibleTokens,
  ]);

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

  const handleLowValueAssetsToggle = useCallback(() => {
    const nextIsExpanded = !isLowValueAssetsExpanded;
    setIsLowValueAssetsExpanded(nextIsExpanded);
    setLowValueAssetsExpandedSessionValue(nextIsExpanded);

    trackEvent({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.LowValueAssetsToggled,
      properties: {
        state: nextIsExpanded ? 'expanded' : 'collapsed',
        count: lowValueAssetCount,
      },
    });
  }, [isLowValueAssetsExpanded, lowValueAssetCount, trackEvent]);

  const renderTokenCell = (token: TokenWithFiatAmount) => {
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
  };

  const renderTokenListItem = ({ item }: { item: TokenListDisplayItem }) => {
    if (item.type === 'low-value-toggle') {
      return (
        <LowValueAssetsToggle
          count={item.count}
          isExpanded={isLowValueAssetsExpanded}
          onClick={handleLowValueAssetsToggle}
        />
      );
    }

    return renderTokenCell(item.token);
  };

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
