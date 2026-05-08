import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type CaipChainId, type Hex } from '@metamask/utils';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Text,
} from '../../components/component-library';
import { TokenManagementCell } from '../../components/multichain/token-management-cell';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  getNativeCurrencyForChain,
  getShouldHideZeroBalanceTokens,
  getTokenSortConfig,
  getUseExternalServices,
} from '../../selectors';
import { getImageForChainId } from '../../selectors/multichain';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
  getIsEvmMultichainNetworkSelected,
  getSelectedMultichainNetworkConfiguration,
} from '../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import {
  ignoreTokens as ignoreTokensAction,
  showModal,
} from '../../store/actions';
import { SettingsV2Header } from '../settings-v2/shared/settings-v2-header';
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
    return t('allPopularNetworks');
  }, [enabledChainIds, networkConfigurations, t]);

  const networkFilterIconUrl: string | undefined = useMemo(() => {
    if (enabledChainIds.length !== 1) {
      return undefined;
    }
    return getImageForChainId(enabledChainIds[0]);
  }, [enabledChainIds]);

  const handleToggle = useCallback(
    async (token: ManagedAsset, nextValue: boolean) => {
      if (nextValue || !('address' in token)) {
        return;
      }
      const key = `${token.chainId}:${token.address.toLowerCase()}`;
      setPendingKey(key);
      try {
        const { networkClientId } = getNetworkMeta(token.chainId as Hex);
        await dispatch(
          ignoreTokensAction({
            tokensToIgnore: [token.address],
            dontShowLoadingIndicator: true,
            networkClientId,
          }),
        );
      } finally {
        setPendingKey(undefined);
      }
    },
    [dispatch, getNetworkMeta],
  );

  const getTokenKey = useCallback(
    (token: ManagedAsset) => {
      const address = 'address' in token ? token.address : token.assetId;
      return `${token.chainId}:${address.toLowerCase()}`;
    },
    [],
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
      const networkName =
        networkConfigurations?.[token.chainId as Hex]?.name ?? token.chainId;
      const isManageableToken =
        !token.isNative &&
        'address' in token &&
        isEvmChainId(token.chainId as Hex | CaipChainId);
      return (
        <TokenManagementCell
          symbol={token.symbol}
          image={getTokenImage(token)}
          networkImage={getImageForChainId(token.chainId)}
          networkName={networkName}
          primaryLabel={token.name ?? token.symbol}
          secondaryLabel={`${token.balance} ${token.symbol}`}
          isOn
          disabled={pendingKey === key}
          onToggle={(nextValue) => handleToggle(token, nextValue)}
          showToggle={isManageableToken}
          testIdSuffix={key}
        />
      );
    },
    [getTokenImage, getTokenKey, handleToggle, networkConfigurations, pendingKey],
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
        {t('noTokensToManage')}
      </Text>
    </Box>
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
      <SettingsV2Header
        title={t('manageTokens')}
        onClose={handleClose}
        showSearchButton={false}
        showCloseButton={false}
      />

      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        paddingInline={4}
        paddingTop={3}
        paddingBottom={2}
      >
        <ButtonBase
          data-testid="token-management-network-filter"
          size={ButtonBaseSize.Sm}
          endIconName={IconName.ArrowDown}
          backgroundColor={BackgroundColor.backgroundDefault}
          color={TextColor.textDefault}
          borderColor={BorderColor.borderMuted}
          onClick={handleOpenNetworkFilter}
          ellipsis
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            {networkFilterIconUrl && (
              <AvatarNetwork
                name={networkFilterLabel}
                src={networkFilterIconUrl}
                size={AvatarNetworkSize.Xs}
                borderWidth={0}
              />
            )}
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
          data={visibleTokens}
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
