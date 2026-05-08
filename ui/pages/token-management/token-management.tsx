import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BoxAlignItems,
  BoxFlexDirection,
  Box as DSBox,
  ButtonIcon,
  ButtonIconSize,
  IconName as DSIconName,
} from '@metamask/design-system-react';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderStyle,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Text,
  TextFieldSearch,
} from '../../components/component-library';
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

type ManagedAsset = Parameters<typeof sortAssetsWithPriority>[0][number];

const TOKEN_MANAGEMENT_CELL_ESTIMATED_SIZE = 72;

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
  const navigate = useNavigate();

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

  const handleClose = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleOpenNetworkFilter = useCallback(() => {
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
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

  const getTokenKey = useCallback(
    (token: ManagedAsset) => {
      const address = 'address' in token ? token.address : token.assetId;
      return `${token.chainId}:${address.toLowerCase()}`;
    },
    [],
  );

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

        await dispatch(multichainIgnoreAssets([token.assetId], token.accountId));
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
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      padding={6}
    >
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {normalizedSearchQuery
          ? t('noTokensMatchSearch')
          : t('noTokensToManage')}
      </Text>
    </Box>
  );

  const startAccessory = (
    <DSBox
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      <ButtonIcon
        iconName={DSIconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Sm}
        onClick={handleClose}
        data-testid="token-management-header-back-button"
      />
    </DSBox>
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      style={{ height: '100%', minHeight: 0 }}
      data-testid="token-management-page"
    >
      <Header startAccessory={startAccessory}>{t('manageTokens')}</Header>

      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        paddingInline={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <TextFieldSearch
          className="w-full"
          value={searchQuery}
          placeholder={t('enterTokenNameOrAddressManageTokens')}
          borderColor={BorderColor.borderMuted}
          onChange={(event) => setSearchQuery(event.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          inputProps={{
            'data-testid': 'token-management-search-input',
          }}
        />
      </Box>

      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        paddingInline={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <ButtonBase
          data-testid="token-management-network-filter"
          size={ButtonBaseSize.Sm}
          startIconName={IconName.Filter}
          backgroundColor={BackgroundColor.backgroundDefault}
          color={TextColor.textDefault}
          borderColor={BorderColor.borderMuted}
          borderStyle={BorderStyle.solid}
          borderWidth={1}
          onClick={handleOpenNetworkFilter}
          ellipsis
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text variant={TextVariant.bodySmMedium} ellipsis>
              {networkFilterLabel}
            </Text>
          </Box>
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
          estimatedItemSize={TOKEN_MANAGEMENT_CELL_ESTIMATED_SIZE}
          overscan={10}
          keyExtractor={getTokenKey}
          listEmptyComponent={emptyState}
          renderItem={renderToken}
        />
      </ScrollContainer>
    </Box>
  );
};

export default TokenManagementPage;
