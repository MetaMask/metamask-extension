import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type Hex } from '@metamask/utils';
import { type Token } from '@metamask/assets-controllers';

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
  getAllTokens,
  getSelectedEvmInternalAccount,
} from '../../selectors';
import { getEnabledNetworksByNamespace } from '../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../shared/constants/network';
import {
  ignoreTokens as ignoreTokensAction,
  addImportedTokens,
  showModal,
} from '../../store/actions';
import { SettingsV2Header } from '../settings-v2/shared/settings-v2-header';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

type ManagedToken = {
  address: string;
  symbol: string;
  decimals?: number;
  image?: string;
  name?: string;
  chainId: Hex;
  networkName?: string;
  networkClientId?: string;
  isImported: boolean;
};

type TokensChainsCacheEntry = {
  data?: Record<
    string,
    {
      address: string;
      symbol?: string;
      name?: string;
      decimals?: number;
      iconUrl?: string;
    }
  >;
};

/**
 * The cached popular-tokens list (`tokensChainsCache`) can be thousands of
 * entries on Ethereum mainnet alone, so we bail out of rendering all of them
 * unconditionally. Popular tokens are only surfaced when the user actively
 * searches; when matched they are also capped to keep the side panel
 * responsive on lower-end devices.
 */
const POPULAR_TOKEN_SEARCH_RESULT_LIMIT = 50;

const tokenMatchesQuery = (
  candidate: { symbol?: string; name?: string; address: string },
  loweredQuery: string,
): boolean => {
  if (!loweredQuery) {
    return true;
  }
  return (
    (candidate.symbol?.toLowerCase().includes(loweredQuery) ?? false) ||
    (candidate.name?.toLowerCase().includes(loweredQuery) ?? false) ||
    candidate.address.toLowerCase().includes(loweredQuery)
  );
};

/**
 * Full-screen Token Management page.
 *
 * Replaces the legacy import-tokens modal flow when the
 * `extensionUxTokenManagementFilter` feature flag is enabled. Lists every
 * token that the user has imported across their currently enabled networks,
 * plus popular tokens cached for those networks that the user can toggle on
 * to import. The network-filter chip mirrors the home page filter and opens
 * the existing Network Manager modal so the two stay in sync.
 *
 * The Figma design (`Token-page-update`, node 1:8292) defines the row cell
 * used for each token row; this page composes those cells under a header
 * with title, search, and a network filter.
 */
export const TokenManagementPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [pendingKey, setPendingKey] = useState<string | undefined>();

  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const allTokens = useSelector(getAllTokens) as Record<
    string,
    Record<string, Token[]>
  >;
  const enabledNetworksByNamespace = useSelector(
    getEnabledNetworksByNamespace,
  );
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const tokensChainsCache = useSelector(
    (state: { metamask: { tokensChainsCache?: Record<Hex, TokensChainsCacheEntry> } }) =>
      state.metamask.tokensChainsCache,
  );

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

  const importedTokens: ManagedToken[] = useMemo(() => {
    const address = selectedEvmAccount?.address;
    if (!address) {
      return [];
    }
    const result: ManagedToken[] = [];
    for (const chainId of enabledChainIds) {
      const { name: networkName, networkClientId } = getNetworkMeta(chainId);
      const importedOnChain = allTokens?.[chainId]?.[address] ?? [];
      for (const token of importedOnChain) {
        result.push({
          address: token.address,
          symbol: token.symbol ?? '',
          decimals: token.decimals,
          image: token.image,
          name: token.name,
          chainId,
          networkName,
          networkClientId,
          isImported: true,
        });
      }
    }
    return result.sort((a, b) =>
      (a.name ?? a.symbol).localeCompare(b.name ?? b.symbol),
    );
  }, [allTokens, enabledChainIds, getNetworkMeta, selectedEvmAccount?.address]);

  const loweredQuery = searchValue.trim().toLowerCase();

  const visibleTokens: ManagedToken[] = useMemo(() => {
    const importedMatches = importedTokens.filter((token) =>
      tokenMatchesQuery(token, loweredQuery),
    );

    // Skip the (potentially massive) popular-token walk unless the user is
    // actively searching for something the imported list doesn't satisfy.
    if (!loweredQuery) {
      return importedMatches;
    }

    const importedKeys = new Set(
      importedTokens.map(
        (token) => `${token.chainId}:${token.address.toLowerCase()}`,
      ),
    );

    const popularMatches: ManagedToken[] = [];
    for (const chainId of enabledChainIds) {
      if (popularMatches.length >= POPULAR_TOKEN_SEARCH_RESULT_LIMIT) {
        break;
      }
      const cached = tokensChainsCache?.[chainId]?.data;
      if (!cached) {
        continue;
      }
      const { name: networkName, networkClientId } = getNetworkMeta(chainId);
      for (const popular of Object.values(cached)) {
        if (popularMatches.length >= POPULAR_TOKEN_SEARCH_RESULT_LIMIT) {
          break;
        }
        const key = `${chainId}:${popular.address.toLowerCase()}`;
        if (importedKeys.has(key)) {
          continue;
        }
        if (!tokenMatchesQuery(popular, loweredQuery)) {
          continue;
        }
        popularMatches.push({
          address: popular.address,
          symbol: popular.symbol ?? '',
          decimals: popular.decimals,
          image: popular.iconUrl,
          name: popular.name,
          chainId,
          networkName,
          networkClientId,
          isImported: false,
        });
      }
    }

    return [...importedMatches, ...popularMatches];
  }, [
    enabledChainIds,
    getNetworkMeta,
    importedTokens,
    loweredQuery,
    tokensChainsCache,
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
    const map = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP as Record<string, string>;
    return map[enabledChainIds[0]];
  }, [enabledChainIds]);

  const handleToggle = useCallback(
    async (token: ManagedToken, nextValue: boolean) => {
      const key = `${token.chainId}:${token.address.toLowerCase()}`;
      setPendingKey(key);
      try {
        if (nextValue) {
          await dispatch(
            addImportedTokens(
              [
                {
                  address: token.address,
                  symbol: token.symbol,
                  decimals: token.decimals ?? 0,
                  image: token.image,
                },
              ],
              token.networkClientId,
            ),
          );
        } else {
          await dispatch(
            ignoreTokensAction({
              tokensToIgnore: [token.address],
              dontShowLoadingIndicator: true,
              networkClientId: token.networkClientId,
            }),
          );
        }
      } finally {
        setPendingKey(undefined);
      }
    },
    [dispatch],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      style={{ minHeight: '100%' }}
      data-testid="token-management-page"
    >
      <SettingsV2Header
        title={t('manageTokens')}
        onClose={handleClose}
        isSearchOpen={isSearchOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCloseSearch={() => setIsSearchOpen(false)}
        searchValue={searchValue}
        searchPlaceholder={t('searchTokens')}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
        showSearchBorder={false}
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

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.Full}
        data-testid="token-management-page-list"
      >
        {visibleTokens.length === 0 ? (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            padding={6}
          >
            <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
              {searchValue ? t('noTokensMatchSearch') : t('noTokensToManage')}
            </Text>
          </Box>
        ) : (
          visibleTokens.map((token) => {
            const key = `${token.chainId}:${token.address.toLowerCase()}`;
            return (
              <TokenManagementCell
                key={key}
                symbol={token.symbol}
                image={token.image}
                primaryLabel={token.name ?? token.symbol}
                secondaryLabel={
                  token.networkName ? token.networkName : token.symbol
                }
                isOn={token.isImported}
                disabled={pendingKey === key}
                onToggle={(nextValue) => handleToggle(token, nextValue)}
                testIdSuffix={key}
              />
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default TokenManagementPage;
