import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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
  parseCaipAssetType,
  type CaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';

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
  getAllMultichainNetworkConfigurations,
  getEnabledNetworksByNamespace,
  getIsEvmMultichainNetworkSelected,
  getSelectedMultichainNetworkConfiguration,
} from '../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import {
  addCustomAsset,
  addImportedTokens,
  hideAsset,
  ignoreTokens as ignoreTokensAction,
  multichainAddAssets,
  multichainIgnoreAssets,
  showModal,
} from '../../store/actions';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  CUSTOM_TOKEN_IMPORT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { getAssetsBySelectedAccountGroup } from '../../selectors/assets';
import { getSelectedAddress } from '../../selectors';
import { getTokensControllerAllTokens } from '../../../shared/lib/selectors/assets-migration';
import {
  getAssetImageUrl,
  isEvmChainId,
  isTronSpecialAsset,
  toAssetId,
} from '../../../shared/lib/asset-utils';
import { sortAssetsWithPriority } from '../../components/app/assets/util/sortAssetsWithPriority';
import { ScrollContainer } from '../../contexts/scroll-container';
import { Header } from '../../components/multichain/pages/page';
import { ASSET_CELL_HEIGHT } from '../../components/app/assets/constants';
import { useTokenSearch } from '../../hooks/useTokenSearch';
import { type TokenSearchResult } from '../../../shared/lib/token-search/token-search-api';

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
  // Includes non-EVM (Solana, Bitcoin, ...) networks keyed by CAIP-2 chain id.
  // Used to resolve a display name when the active enabled network is non-EVM,
  // which is missing from the EVM-only `networkConfigurations` map above.
  const allMultichainNetworkConfigurations = useSelector(
    getAllMultichainNetworkConfigurations,
  );
  // Raw TokensController state. `accountGroupIdAssets` (via
  // `selectAssetsBySelectedAccountGroup`) filters out tokens that don't yet
  // have a balance entry, which is exactly the case right after the user
  // imports a token from a search result. Reading `allTokens` directly lets
  // the toggle (and the home list) reflect the import immediately.
  const allTokensByChain = useSelector(getTokensControllerAllTokens) as Record<
    string,
    Record<string, { address: string }[]>
  >;
  const selectedAddress = useSelector(getSelectedAddress) as
    | string
    | undefined;

  // Looks up the internal account in the selected account group that maps to
  // a given CAIP chain id. Used when importing a search result so the unified
  // AssetsController has an account to associate the asset with.
  const getAccountForChain = useSelector(
    (state: unknown) =>
      (caipChainId: CaipChainId) =>
        getInternalAccountBySelectedAccountGroupAndCaip(
          state as Parameters<
            typeof getInternalAccountBySelectedAccountGroupAndCaip
          >[0],
          caipChainId,
        ),
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

    // Dedupe by (chainId, address|assetId). The upstream asset selector
    // currently emits a duplicate entry for the same token on some chains
    // (seen on Linea, chainId 0xe708). That manifests as a React "two
    // children with the same key" warning AND breaks the hide-token flow,
    // because clicking the toggle ignores one copy but the duplicate stays
    // in the list, making the row appear unchanged.
    const seen = new Set<string>();
    const dedupedAssets: typeof accountAssetsPreSort = [];
    accountAssetsPreSort.forEach((asset) => {
      const id =
        'address' in asset && asset.address ? asset.address : asset.assetId;
      const key = `${asset.chainId}:${String(id).toLowerCase()}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      dedupedAssets.push(asset);
    });

    const accountAssets = sortAssetsWithPriority(
      dedupedAssets,
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

  const normalizedSearchQuery = searchQuery.trim();

  // Build the CAIP-2 network filter for the search API. When the user has a
  // single network selected, the API call is scoped to that network; when "All
  // networks" is selected, we pass every enabled chain id so the API still
  // honors the user's network filter rather than defaulting to its full list.
  const searchNetworks = useMemo(() => {
    if (enabledChainIds.length === 0) {
      return undefined;
    }
    return enabledChainIds.map((chainId) =>
      formatChainIdToCaip(chainId as Hex | CaipChainId),
    );
  }, [enabledChainIds]);

  const {
    results: searchResults,
    isLoading: isSearching,
    error: searchError,
    hasQuery,
    hasResults,
  } = useTokenSearch({
    query: normalizedSearchQuery,
    networks: searchNetworks,
  });

  // Quick lookup of which search results are already in the user's manage
  // list, so the toggle on each row reflects current state instead of always
  // starting OFF.
  //
  // We index two ways because the unified asset selector and the Token API
  // do not always emit the exact same `assetId` string:
  //   - lowercased `assetId` for non-EVM
  //   - synthesized `<chainHex>:<address>` key for EVM, which is stable
  //     across checksum vs lowercase addresses and CAIP-2 vs hex chain ids.
  const chainToHex = useCallback((chainId: string): string => {
    if (chainId.startsWith('eip155:')) {
      const dec = Number(chainId.split(':')[1]);
      return Number.isFinite(dec)
        ? `0x${dec.toString(16)}`.toLowerCase()
        : chainId.toLowerCase();
    }
    return chainId.toLowerCase();
  }, []);

  // Pull every imported EVM token address for the current account out of
  // TokensController directly. This bypasses the balance-gated filter inside
  // `selectAssetsBySelectedAccountGroup`, which would otherwise hide a token
  // for the few seconds between import and the first balance fetch.
  const importedEvmTokensByChain = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!selectedAddress) {
      return map;
    }
    const lowercasedSelected = selectedAddress.toLowerCase();
    Object.entries(allTokensByChain ?? {}).forEach(
      ([chainId, tokensByAddress]) => {
        const hexChainId = chainToHex(chainId);
        Object.entries(tokensByAddress ?? {}).forEach(
          ([accountAddress, tokens]) => {
            if (accountAddress.toLowerCase() !== lowercasedSelected) {
              return;
            }
            const set = map.get(hexChainId) ?? new Set<string>();
            tokens.forEach((token) => {
              if (token?.address) {
                set.add(token.address.toLowerCase());
              }
            });
            map.set(hexChainId, set);
          },
        );
      },
    );
    return map;
  }, [allTokensByChain, chainToHex, selectedAddress]);

  const importedAssetIds = useMemo(() => {
    const set = new Set<string>();
    visibleTokens.forEach((token) => {
      if (token.assetId) {
        set.add(String(token.assetId).toLowerCase());
      }
      if ('address' in token && token.address && token.chainId) {
        set.add(
          `${chainToHex(String(token.chainId))}:${String(
            token.address,
          ).toLowerCase()}`,
        );
      }
    });
    importedEvmTokensByChain.forEach((addresses, chainHex) => {
      addresses.forEach((address) => {
        set.add(`${chainHex}:${address}`);
      });
    });
    return set;
  }, [chainToHex, importedEvmTokensByChain, visibleTokens]);

  const handleOpenNetworkFilter = useCallback(() => {
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
  }, [dispatch]);

  const handleAddCustomToken = useCallback(() => {
    navigate(CUSTOM_TOKEN_IMPORT_ROUTE);
  }, [navigate]);

  const networkFilterLabel = useMemo(() => {
    const enabledCount = enabledChainIds.length;
    if (enabledCount === 0) {
      return t('noNetworksSelected');
    }
    if (enabledCount === 1) {
      const onlyChain = enabledChainIds[0];
      // EVM chains are keyed by hex (`0x1`) in `networkConfigurations`; non-EVM
      // chains (Solana, Bitcoin, …) live only in the multichain map keyed by
      // their CAIP-2 id (`solana:…`). Try both before falling back.
      const evmName = networkConfigurations?.[onlyChain]?.name;
      const multichainName =
        allMultichainNetworkConfigurations?.[onlyChain as CaipChainId]?.name;
      return evmName ?? multichainName ?? currentNetwork?.name ?? t('currentNetwork');
    }
    return t('allDefaultNetworks');
  }, [
    allMultichainNetworkConfigurations,
    currentNetwork?.name,
    enabledChainIds,
    networkConfigurations,
    t,
  ]);

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

      // eslint-disable-next-line no-console
      console.log('[TokenManagement] handleToggle', {
        nextValue,
        chainId: token.chainId,
        address: 'address' in token ? token.address : undefined,
        assetId: token.assetId,
        accountId: token.accountId,
        isNativeToken,
        isEvmToken,
        canIgnoreEvmToken,
        canIgnoreMultichainToken,
      });

      if (
        nextValue ||
        isNativeToken ||
        (!canIgnoreEvmToken && !canIgnoreMultichainToken)
      ) {
        // eslint-disable-next-line no-console
        console.warn('[TokenManagement] handleToggle early-exit', {
          nextValue,
          isNativeToken,
          canIgnoreEvmToken,
          canIgnoreMultichainToken,
        });
        return;
      }

      const key = getTokenKey(token);
      setPendingKey(key);
      try {
        if (canIgnoreEvmToken) {
          const { networkClientId } = getNetworkMeta(token.chainId as Hex);
          if (!networkClientId) {
            // eslint-disable-next-line no-console
            console.warn(
              '[TokenManagement] handleToggle missing networkClientId',
              token.chainId,
            );
            return;
          }
          // eslint-disable-next-line no-console
          console.log('[TokenManagement] dispatching ignoreTokens', {
            address: token.address,
            networkClientId,
          });
          await dispatch(
            ignoreTokensAction({
              tokensToIgnore: [token.address],
              dontShowLoadingIndicator: true,
              networkClientId,
            }),
          );
          // Also drive the unified AssetsController hide so the home list
          // reflects the change when `ASSETS_UNIFIED_STATE_ENABLED` is on.
          // Mirrors `hide-token-confirmation-modal.js`. Wrapped in try/catch
          // so a build without the unified controller is a no-op.
          try {
            const caipAssetId = toAssetId(
              token.address as Hex,
              token.chainId as Hex,
            );
            if (caipAssetId) {
              await dispatch(hideAsset(caipAssetId));
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[TokenManagement] hideAsset failed', err);
          }
          return;
        }

        await dispatch(
          multichainIgnoreAssets([token.assetId], token.accountId),
        );
        try {
          await dispatch(hideAsset(token.assetId as CaipAssetType));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[TokenManagement] hideAsset failed', err);
        }
      } finally {
        setPendingKey(undefined);
      }
    },
    [dispatch, getNetworkMeta, getTokenKey],
  );

  /**
   * Search-result-specific toggle. Mirrors the mobile import flow
   * (`metamask-mobile#26108`):
   *
   *  - EVM result, toggle ON  → `addImportedTokens([token], networkClientId)`.
   *  - EVM result, toggle OFF → `ignoreTokens([address], networkClientId)`.
   *  - Non-EVM result, toggle ON  → `multichainAddAssets([assetId], accountId)`.
   *  - Non-EVM result, toggle OFF → `multichainIgnoreAssets([assetId], accountId)`.
   */
  const handleSearchResultToggle = useCallback(
    async (result: TokenSearchResult, nextValue: boolean) => {
      // eslint-disable-next-line no-console
      console.log('[TokenManagement] handleSearchResultToggle', {
        assetId: result.assetId,
        nextValue,
      });
      let parsed;
      try {
        parsed = parseCaipAssetType(result.assetId as CaipAssetType);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[TokenManagement] failed to parse assetId', err);
        return;
      }
      const { chainId: caipChainId, assetReference } = parsed;
      if (!caipChainId || !assetReference) {
        // eslint-disable-next-line no-console
        console.warn('[TokenManagement] missing chain/reference', parsed);
        return;
      }

      const importedKey = result.assetId.toLowerCase();
      const isEvm = isEvmChainId(caipChainId);
      setPendingKey(importedKey);
      try {
        if (isEvm) {
          // Map CAIP-2 `eip155:<decimal>` → hex chain id for the EVM store
          // actions, which all expect hex chain ids.
          const [, reference] = caipChainId.split(':');
          const decimalChainId = Number(reference);
          if (!Number.isFinite(decimalChainId)) {
            return;
          }
          const hexChainId = `0x${decimalChainId.toString(16)}` as Hex;
          const { networkClientId } = getNetworkMeta(hexChainId);
          if (!networkClientId) {
            // eslint-disable-next-line no-console
            console.warn(
              '[TokenManagement] no network client for',
              hexChainId,
            );
            return;
          }

          // Look up the EVM account in the current group so we can also feed
          // the unified AssetsController via addCustomAsset/hideAsset.
          const evmAccount = getAccountForChain(caipChainId);

          if (nextValue) {
            // eslint-disable-next-line no-console
            console.log('[TokenManagement] dispatching addImportedTokens', {
              address: assetReference,
              symbol: result.symbol,
              networkClientId,
            });
            try {
              await dispatch(
                addImportedTokens(
                  [
                    {
                      address: assetReference,
                      symbol: result.symbol,
                      decimals: result.decimals,
                      isERC721: false,
                      name: result.name,
                      ...(result.iconUrl ? { image: result.iconUrl } : {}),
                    },
                  ],
                  networkClientId,
                ),
              );
              // eslint-disable-next-line no-console
              console.log('[TokenManagement] addImportedTokens resolved');
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('[TokenManagement] addImportedTokens failed', err);
            }
            // Also feed the unified AssetsController so the home list
            // recognizes the imported asset when the feature flag is on.
            try {
              if (evmAccount?.id) {
                // eslint-disable-next-line no-console
                console.log(
                  '[TokenManagement] dispatching addCustomAsset',
                  {
                    accountId: evmAccount.id,
                    assetId: result.assetId,
                  },
                );
                await dispatch(
                  addCustomAsset(
                    evmAccount.id,
                    result.assetId as CaipAssetType,
                  ),
                );
                // eslint-disable-next-line no-console
                console.log('[TokenManagement] addCustomAsset resolved');
              } else {
                // eslint-disable-next-line no-console
                console.warn(
                  '[TokenManagement] skipping addCustomAsset (no evmAccount)',
                  { caipChainId },
                );
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[TokenManagement] addCustomAsset failed', err);
            }
            return;
          }
          await dispatch(
            ignoreTokensAction({
              tokensToIgnore: [assetReference],
              dontShowLoadingIndicator: true,
              networkClientId,
            }),
          );
          try {
            await dispatch(hideAsset(result.assetId as CaipAssetType));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[TokenManagement] hideAsset failed', err);
          }
          return;
        }

        // Non-EVM path. Mirrors mobile's
        // `MultichainAssetsController.addAssets([assetId], accountId)`.
        const account = getAccountForChain(caipChainId);
        if (!account?.id) {
          return;
        }
        if (nextValue) {
          await dispatch(multichainAddAssets([result.assetId], account.id));
          try {
            await dispatch(
              addCustomAsset(account.id, result.assetId as CaipAssetType),
            );
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[TokenManagement] addCustomAsset failed', err);
          }
          return;
        }
        await dispatch(multichainIgnoreAssets([result.assetId], account.id));
        try {
          await dispatch(hideAsset(result.assetId as CaipAssetType));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[TokenManagement] hideAsset failed', err);
        }
      } finally {
        setPendingKey(undefined);
      }
    },
    [dispatch, getAccountForChain, getNetworkMeta],
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

  /**
   * Custom-token import is only meaningful on EVM networks today. Hide the
   * sticky CTA when none of the enabled networks (across all namespaces)
   * support custom tokens. Showing it for a mix that includes an EVM network
   * preserves the existing "All networks" behavior.
   */
  const canImportCustomTokens = useMemo(() => {
    if (allEnabledNetworksForAllNamespaces.length === 0) {
      return true;
    }
    return allEnabledNetworksForAllNamespaces.some((chainId) =>
      isEvmChainId(chainId as Hex | CaipChainId),
    );
  }, [allEnabledNetworksForAllNamespaces]);

  const renderSearchResult = useCallback(
    (info: { item: TokenSearchResult }) => {
      const result = info.item;
      const lowerAssetId = result.assetId.toLowerCase();
      const parsed = parseCaipAssetType(result.assetId as CaipAssetType);
      const isEvm = isEvmChainId(parsed.chainId);

      let hexChainId: Hex | undefined;
      if (isEvm) {
        const [, reference] = parsed.chainId.split(':');
        const decimalChainId = Number(reference);
        if (Number.isFinite(decimalChainId)) {
          hexChainId = `0x${decimalChainId.toString(16)}` as Hex;
        }
      }

      const evmImportedKey = hexChainId
        ? `${hexChainId}:${parsed.assetReference.toLowerCase()}`
        : undefined;
      const isImported =
        importedAssetIds.has(lowerAssetId) ||
        (evmImportedKey ? importedAssetIds.has(evmImportedKey) : false);

      if (
        // eslint-disable-next-line no-restricted-globals
        typeof window !== 'undefined' &&
        (window as unknown as { __TOKEN_MGMT_DEBUG?: boolean })
          .__TOKEN_MGMT_DEBUG
      ) {
        // eslint-disable-next-line no-console
        console.log('[TokenManagement] row state', {
          lowerAssetId,
          evmImportedKey,
          isImported,
          importedSize: importedAssetIds.size,
        });
      }

      return (
        <TokenManagementCell
          symbol={result.symbol}
          image={
            result.iconUrl ||
            getAssetImageUrl(result.assetId, parsed.chainId) ||
            undefined
          }
          chainId={(hexChainId ?? parsed.chainId) as Hex | CaipChainId}
          assetId={result.assetId as CaipAssetType}
          primaryLabel={result.name || result.symbol}
          secondaryLabel={
            networkConfigurations?.[hexChainId as Hex]?.name ?? parsed.chainId
          }
          isOn={isImported}
          disabled={pendingKey === lowerAssetId}
          onToggle={(nextValue) => handleSearchResultToggle(result, nextValue)}
          showToggle
          testIdSuffix={`search-${lowerAssetId}`}
        />
      );
    },
    [
      handleSearchResultToggle,
      importedAssetIds,
      networkConfigurations,
      pendingKey,
    ],
  );

  const getSearchResultKey = useCallback(
    (result: TokenSearchResult) => `search-${result.assetId.toLowerCase()}`,
    [],
  );

  const emptyState = (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
      data-testid="token-management-empty-state"
    >
      <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
        {hasQuery ? t('noTokensMatchSearch') : t('noTokensToManage')}
      </Text>
    </Box>
  );

  const searchErrorState = (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
      data-testid="token-management-search-error"
    >
      <Text
        variant={TextVariant.BodyMd}
        textAlign={TextAlign.Center}
        color={TextColor.ErrorDefault}
      >
        {t('tokenSearchError')}
      </Text>
    </Box>
  );

  const loadingState = (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={6}
      data-testid="token-management-search-loading"
    >
      <Text
        variant={TextVariant.BodyMd}
        textAlign={TextAlign.Center}
        color={TextColor.TextAlternative}
      >
        {t('loading')}
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
        {hasQuery ? (
          <>
            {isSearching && !hasResults ? loadingState : null}
            {!isSearching && searchError ? searchErrorState : null}
            {!isSearching && !searchError ? (
              <VirtualizedList
                data={searchResults}
                estimatedItemSize={ASSET_CELL_HEIGHT}
                overscan={10}
                keyExtractor={getSearchResultKey}
                listEmptyComponent={emptyState}
                renderItem={renderSearchResult}
              />
            ) : null}
          </>
        ) : (
          <VirtualizedList
            data={visibleTokens}
            estimatedItemSize={ASSET_CELL_HEIGHT}
            overscan={10}
            keyExtractor={getTokenKey}
            listEmptyComponent={emptyState}
            renderItem={renderToken}
          />
        )}
      </ScrollContainer>

      {canImportCustomTokens ? (
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
      ) : null}
    </Box>
  );
};

export default TokenManagementPage;
