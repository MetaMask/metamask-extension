import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  ButtonBaseSize,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  Icon,
  IconSize,
  Input,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';

import { TokenManagementCell } from '../../components/multichain/token-management-cell';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  getNativeCurrencyForChain,
  getShouldHideZeroBalanceTokens,
  getTokenSortConfig,
  getUseExternalServices,
} from '../../selectors';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
  getIsEvmMultichainNetworkSelected,
  getSelectedMultichainNetworkConfiguration,
} from '../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import {
  ignoreTokens as ignoreTokensAction,
  multichainIgnoreAssets,
  showImportTokensModal,
  showModal,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { getAssetsBySelectedAccountGroup } from '../../selectors/assets';
import {
  getAssetImageUrl,
  isEvmChainId,
  isTronSpecialAsset,
} from '../../../shared/lib/asset-utils';
import { sortAssetsWithPriority } from '../../components/app/assets/util/sortAssetsWithPriority';
import { ScrollContainer } from '../../contexts/scroll-container';
import { Header } from '../../components/multichain/pages/page';
import { ASSET_CELL_HEIGHT } from '../../components/app/assets/constants';

type ManagedAsset = Parameters<typeof sortAssetsWithPriority>[0][number];

/**
 * Full-screen Token Management page.
 *
 * Replaces the legacy import-tokens modal flow when the
 * `extensionUxTokenManagementFilter` feature flag is enabled. The token list
 * mirrors the home-page asset list for the current network filter, and lets
 * users hide manageable EVM tokens from that list.
 *
 * The Figma design (`Token-page-update`, node 1:8292) defines the row cell
 * used for each token row; this page composes those cells under a header
 * with title and a network filter.
 */
export const TokenManagementPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [pendingKey, setPendingKey] = useState<string | undefined>();

  const accountGroupIdAssets = useSelector(
    getAssetsBySelectedAccountGroup,
  ) as Record<string, ManagedAsset[]>;
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const useExternalServices = useSelector(getUseExternalServices);
  const isEvm = useSelector(getIsEvmMultichainNetworkSelected);
  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  // Wrapped in a safe selector so a partially hydrated multichain state
  // (which can throw in `parseCaipChainId`) cannot blank the entire page.
  const enabledNetworksByNamespace = useSelector((state: unknown) => {
    try {
      return getEnabledNetworksByNamespace(
        state as Parameters<typeof getEnabledNetworksByNamespace>[0],
      );
    } catch {
      return {} as Record<string, boolean>;
    }
  });
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const enabledChainIds = useMemo(
    () =>
      Object.entries(enabledNetworksByNamespace ?? {})
        .filter(([, enabled]) => Boolean(enabled))
        .map(([chainId]) => chainId as Hex),
    [enabledNetworksByNamespace],
  );

  const getNetworkMeta = useCallback(
    (chainId: Hex) => {
      const config = networkConfigurations?.[chainId];
      const endpoint =
        config?.rpcEndpoints?.[config.defaultRpcEndpointIndex ?? 0];
      return {
        name: config?.name,
        networkClientId: endpoint?.networkClientId,
      };
    },
    [networkConfigurations],
  );

  const visibleTokens: ManagedAsset[] = useMemo(() => {
    const accountAssetsPreSort = Object.entries(accountGroupIdAssets).flatMap(
      ([chainId, assets]) => {
        if (!allEnabledNetworksForAllNamespaces.includes(chainId)) {
          return [];
        }

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
    ) as ManagedAsset[];

    if (useExternalServices) {
      return accountAssets;
    }

    return accountAssets.filter(
      (asset) =>
        isEvmChainId(asset.chainId as Hex | CaipChainId) ||
        (!isEvm && asset.chainId === currentNetwork?.chainId),
    );
  }, [
    accountGroupIdAssets,
    allEnabledNetworksForAllNamespaces,
    currentNetwork?.chainId,
    isEvm,
    shouldHideZeroBalanceTokens,
    tokenSortConfig,
    useExternalServices,
  ]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredVisibleTokens = useMemo(() => {
    if (!normalizedSearchQuery) {
      return visibleTokens;
    }

    return visibleTokens.filter((token) =>
      [
        token.name,
        token.symbol,
        'address' in token ? token.address : undefined,
        token.assetId,
        token.chainId,
      ].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(normalizedSearchQuery),
      ),
    );
  }, [normalizedSearchQuery, visibleTokens]);

  const handleOpenNetworkFilter = useCallback(() => {
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
  }, [dispatch]);

  const handleAddCustomToken = useCallback(() => {
    dispatch(showImportTokensModal());
  }, [dispatch]);

  const networkFilterLabel = useMemo(() => {
    const enabledCount = enabledChainIds.length;
    if (enabledCount === 0) {
      return t('noNetworksSelected');
    }
    if (enabledCount === 1) {
      const onlyChain = enabledChainIds[0];
      return networkConfigurations?.[onlyChain]?.name ?? t('currentNetwork');
    }
    return t('allDefaultNetworks');
  }, [enabledChainIds, networkConfigurations, t]);

  const getTokenKey = useCallback((token: ManagedAsset) => {
    const address = 'address' in token ? token.address : token.assetId;
    return `${token.chainId}:${address.toLowerCase()}`;
  }, []);

  const handleToggle = useCallback(
    async (token: ManagedAsset, nextValue: boolean) => {
      const isNativeToken = Boolean(token.isNative);
      const isEvmToken = isEvmChainId(token.chainId as Hex | CaipChainId);
      const canIgnoreEvmToken = isEvmToken && 'address' in token;
      const canIgnoreMultichainToken =
        !isEvmToken && Boolean(token.assetId) && Boolean(token.accountId);

      if (
        nextValue ||
        isNativeToken ||
        (!canIgnoreEvmToken && !canIgnoreMultichainToken)
      ) {
        return;
      }

      const key = getTokenKey(token);
      setPendingKey(key);
      try {
        if (canIgnoreEvmToken) {
          const { networkClientId } = getNetworkMeta(token.chainId as Hex);
          await dispatch(
            ignoreTokensAction({
              tokensToIgnore: [token.address],
              dontShowLoadingIndicator: true,
              networkClientId,
            }),
          );
          return;
        }

        await dispatch(
          multichainIgnoreAssets([token.assetId], token.accountId),
        );
      } finally {
        setPendingKey(undefined);
      }
    },
    [dispatch, getNetworkMeta, getTokenKey],
  );

  const getTokenImage = useCallback((token: ManagedAsset) => {
    if (token.isNative && isEvmChainId(token.chainId as Hex | CaipChainId)) {
      return getNativeCurrencyForChain(token.chainId as Hex) ?? token.image;
    }

    return (
      token.image ||
      getAssetImageUrl(token.assetId, token.chainId as Hex | CaipChainId) ||
      undefined
    );
  }, []);

  const renderToken = useCallback(
    (info: { item: ManagedAsset }) => {
      const token = info.item;
      const key = getTokenKey(token);
      const isNativeToken = Boolean(token.isNative);
      const isEvmToken = isEvmChainId(token.chainId as Hex | CaipChainId);
      const isManageableToken =
        !isNativeToken &&
        ((isEvmToken && 'address' in token) ||
          (!isEvmToken && Boolean(token.assetId) && Boolean(token.accountId)));
      return (
        <TokenManagementCell
          symbol={token.symbol}
          image={getTokenImage(token)}
          chainId={token.chainId as Hex | CaipChainId}
          isNative={token.isNative}
          assetId={token.assetId as CaipAssetType | Hex}
          primaryLabel={token.name ?? token.symbol}
          secondaryLabel={`${token.balance} ${token.symbol}`}
          isOn
          disabled={isNativeToken || pendingKey === key}
          onToggle={(nextValue) => handleToggle(token, nextValue)}
          showToggle={isManageableToken || isNativeToken}
          testIdSuffix={key}
        />
      );
    },
    [getTokenImage, getTokenKey, handleToggle, pendingKey],
  );

  const emptyState = (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
    >
      <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
        {normalizedSearchQuery
          ? t('noTokensMatchSearch')
          : t('noTokensToManage')}
      </Text>
    </Box>
  );

  const startAccessory = (
    <Link to={DEFAULT_ROUTE} aria-label={t('back')}>
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Sm}
        data-testid="token-management-header-back-button"
      />
    </Link>
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="w-full h-full min-h-0"
      data-testid="token-management-page"
    >
      <Header startAccessory={startAccessory}>{t('manageTokens')}</Header>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingHorizontal={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <Box className="relative w-full">
          <Icon
            name={IconName.Search}
            size={IconSize.Sm}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-icon-alternative"
          />
          <Input
            type="search"
            value={searchQuery}
            placeholder={t('enterTokenNameOrAddressManageTokens')}
            onChange={(event) => setSearchQuery(event.target.value)}
            data-testid="token-management-search-input"
            className="h-14 rounded-full border border-muted bg-muted py-0 pl-12 pr-12 text-default focus:border-muted"
          />
          {searchQuery ? (
            <ButtonIcon
              type="button"
              ariaLabel={t('clear')}
              iconName={IconName.CircleX}
              size={ButtonIconSize.Sm}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
          ) : null}
        </Box>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingHorizontal={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <ButtonBase
          data-testid="token-management-network-filter"
          size={ButtonBaseSize.Sm}
          startIconName={IconName.Filter}
          className="bg-default text-default border border-muted"
          onClick={handleOpenNetworkFilter}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            ellipsis
          >
            {networkFilterLabel}
          </Text>
        </ButtonBase>
      </Box>

      <ScrollContainer
        data-testid="token-management-page-list"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <VirtualizedList
          data={filteredVisibleTokens}
          estimatedItemSize={ASSET_CELL_HEIGHT}
          overscan={10}
          keyExtractor={getTokenKey}
          listEmptyComponent={emptyState}
          renderItem={renderToken}
        />
      </ScrollContainer>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        paddingHorizontal={4}
        paddingTop={3}
        paddingBottom={3}
        className="sticky bottom-0 z-10"
      >
        <ButtonBase
          data-testid="token-management-add-custom-token-button"
          className="w-full bg-muted text-default hover:bg-muted-hover active:bg-muted-pressed"
          onClick={handleAddCustomToken}
        >
          {t('addCustomToken')}
        </ButtonBase>
      </Box>
    </Box>
  );
};

export default TokenManagementPage;
