import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
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
import { formatChainIdToCaip } from '@metamask/bridge-controller';

import { TokenManagementCell } from '../../components/multichain/token-management-cell';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  getNativeCurrencyForChain,
  getShouldHideZeroBalanceTokens,
  getTokenSortConfig,
  getUseExternalServices,
  getSelectedAddress,
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
import {
  getMultiChainAssetsControllerAllIgnoredAssets,
  getTokensControllerAllIgnoredTokens,
  getTokensControllerAllTokens,
} from '../../../shared/lib/selectors/assets-migration';
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
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTokenSearch } from '../../hooks/useTokenSearch';
import { type TokenSearchResult } from '../../../shared/lib/token-search/token-search-api';
import {
  convertSearchResultToImportPayload,
  type SearchResultImportPayload,
} from '../../../shared/lib/token-search/convert-search-result';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import {
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../components/component-library';

type ManagedAsset = Parameters<typeof sortAssetsWithPriority>[0][number];

/**
 * Debounce window applied to the search input before it reaches the Token API.
 * Keeps the request rate sane while still feeling instant.
 */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Full-screen Token Management page.
 *
 * Replaces the legacy import-tokens modal flow when the
 * `extensionUxTokenManagementFilter` feature flag is enabled. The token list
 * mirrors the home-page asset list for the current network filter, and lets
 * users hide manageable EVM tokens from that list.
 *
 */
export const TokenManagementPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const addPendingKey = useCallback((key: string) => {
    setPendingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const removePendingKey = useCallback((key: string) => {
    setPendingKeys((prev) => {
      if (!prev.has(key)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  /**
   * Tokens the user has toggled OFF in this session but whose hide we
   * intentionally defer: the row stays visible (showing the toggle as OFF)
   * and the user can still flip it back ON to restore. The actual hide
   * dispatch is flushed when the page unmounts, so leaving the screen is
   * the implicit "commit".
   *
   * Keyed by the lowercased CAIP asset id so the same key works whether
   * the toggle is hit from the visible-list view or from a search result.
   */
  type StagedHidePayload =
    | {
        kind: 'evm';
        hexChainId: Hex;
        address: string;
        caipAssetId?: CaipAssetType;
      }
    | {
        kind: 'multichain';
        assetId: CaipAssetType;
        accountId: string;
      };

  const [stagedHideKeys, setStagedHideKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  // Render override for hides already flushed but not yet reflected in Redux.
  const [committedHideKeys, setCommittedHideKeys] = useState<
    ReadonlySet<string>
  >(() => new Set<string>());
  const stagedHidesRef = useRef<Map<string, StagedHidePayload>>(new Map());

  const stageHide = useCallback(
    (key: string, payload: StagedHidePayload) => {
      stagedHidesRef.current.set(key, payload);
      setStagedHideKeys(new Set(stagedHidesRef.current.keys()));
    },
    [],
  );

  const unstageHide = useCallback((key: string) => {
    if (!stagedHidesRef.current.has(key)) {
      return false;
    }
    stagedHidesRef.current.delete(key);
    setStagedHideKeys(new Set(stagedHidesRef.current.keys()));
    return true;
  }, []);

  const addCommittedHideKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) {
      return;
    }

    setCommittedHideKeys((previousKeys) => {
      const nextKeys = new Set(previousKeys);
      keys.forEach((key) => nextKeys.add(key));
      return nextKeys;
    });
  }, []);

  const removeCommittedHideKey = useCallback((key: string) => {
    setCommittedHideKeys((previousKeys) => {
      if (!previousKeys.has(key)) {
        return previousKeys;
      }

      const nextKeys = new Set(previousKeys);
      nextKeys.delete(key);
      return nextKeys;
    });
  }, []);

  const getStagedHideKey = useCallback(
    (token: ManagedAsset): string | null => {
      if (isEvmChainId(token.chainId as Hex | CaipChainId)) {
        if (!('address' in token) || !token.address) {
          return null;
        }
        const caip = toAssetId(token.address as Hex, token.chainId as Hex);
        return caip ? caip.toLowerCase() : null;
      }
      return token.assetId ? String(token.assetId).toLowerCase() : null;
    },
    [],
  );

  /**
   * Flushes every staged hide to the underlying controllers. Stored behind
   * a ref + late-binding effect so each invocation picks up the most recent
   * `dispatch` / `getNetworkMeta` / flag values rather than stale closures.
   */
  const commitStagedHidesRef = useRef<() => Promise<void>>(
    async () => undefined,
  );

  // Tracks whether the component is still mounted so the commit path can
  // skip `setStagedHideKeys` during unmount cleanup (which would otherwise
  // log a "state update on unmounted component" warning in development).
  const isMountedRef = useRef(true);

  /**
   * Imperative "flush the staged hides now" — wired to every non-toggle
   * interaction that we treat as the user having moved on (search input,
   * network filter, add-custom CTA, navigation away). Re-toggling the same
   * staged token does NOT commit; instead it unstages, which is what
   * powers the in-page restore behavior.
   */
  const commitStagedHides = useCallback(async () => {
    if (stagedHidesRef.current.size === 0) {
      return;
    }
    await commitStagedHidesRef.current();
  }, []);

  const isAssetsUnifiedStateInBuild = useMemo(
    () => getIsAssetsUnifiedStateIncludedInBuild(),
    [],
  );

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
  const allIgnoredTokensByChain = useSelector(
    getTokensControllerAllIgnoredTokens,
  ) as Record<string, Record<string, string[]>>;
  const allIgnoredAssetsByAccount = useSelector(
    getMultiChainAssetsControllerAllIgnoredAssets,
  ) as Record<string, CaipAssetType[]>;
  const selectedAddress = useSelector(getSelectedAddress) as string | undefined;

  // Looks up the internal account in the selected account group that maps to
  // a given CAIP chain id. Used when importing a search result so the unified
  // AssetsController has an account to associate the asset with.
  //
  // Backed by `useStore` (not `useSelector`) because we only need the current
  // state at the moment the user toggles a row — subscribing here would
  // produce a fresh function on every dispatch, breaking memoization
  // downstream and forcing the whole page to re-render on unrelated state
  // changes.
  const store = useStore();
  const getAccountForChain = useCallback(
    (caipChainId: CaipChainId) =>
      getInternalAccountBySelectedAccountGroupAndCaip(
        store.getState() as Parameters<
          typeof getInternalAccountBySelectedAccountGroupAndCaip
        >[0],
        caipChainId,
      ),
    [store],
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
  const debouncedSearchQuery = useDebouncedValue(
    normalizedSearchQuery,
    SEARCH_DEBOUNCE_MS,
  );

  const searchNetworks = useMemo(() => {
    if (enabledChainIds.length === 0) {
      return undefined;
    }
    return enabledChainIds.map((chainId) =>
      formatChainIdToCaip(chainId as Hex | CaipChainId),
    );
  }, [enabledChainIds]);

  const {
    data: searchResponse,
    isFetching: isSearchFetching,
    error: searchQueryError,
  } = useTokenSearch({
    query: debouncedSearchQuery,
    networks: searchNetworks,
  });

  const hasQuery = normalizedSearchQuery.length > 0;
  const isWaitingForDebounce =
    hasQuery && normalizedSearchQuery !== debouncedSearchQuery;

  const searchResults = hasQuery ? (searchResponse?.data ?? []) : [];
  const hasResults = searchResults.length > 0;
  const isSearching =
    isWaitingForDebounce ||
    (hasQuery && debouncedSearchQuery.length > 0 && isSearchFetching);
  const searchError = hasQuery ? searchQueryError : null;

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

  const ignoredEvmAssetIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedAddress) {
      return set;
    }

    const lowercasedSelectedAddress = selectedAddress.toLowerCase();
    Object.entries(allIgnoredTokensByChain ?? {}).forEach(
      ([chainId, tokensByAddress]) => {
        const hexChainId = chainToHex(chainId);
        Object.entries(tokensByAddress ?? {}).forEach(
          ([accountAddress, tokenAddresses]) => {
            if (accountAddress.toLowerCase() !== lowercasedSelectedAddress) {
              return;
            }

            tokenAddresses.forEach((tokenAddress) => {
              const lowercasedTokenAddress = tokenAddress.toLowerCase();
              set.add(`${hexChainId}:${lowercasedTokenAddress}`);
              const caipAssetId = toAssetId(
                tokenAddress as Hex,
                hexChainId as Hex,
              );
              if (caipAssetId) {
                set.add(caipAssetId.toLowerCase());
              }
            });
          },
        );
      },
    );
    return set;
  }, [allIgnoredTokensByChain, chainToHex, selectedAddress]);

  const handleOpenNetworkFilter = useCallback(() => {
    commitStagedHides().catch(() => undefined);
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
  }, [commitStagedHides, dispatch]);

  const handleAddCustomToken = useCallback(() => {
    commitStagedHides().catch(() => undefined);
    navigate(CUSTOM_TOKEN_IMPORT_ROUTE);
  }, [commitStagedHides, navigate]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      commitStagedHides().catch(() => undefined);
      setSearchQuery(event.target.value);
    },
    [commitStagedHides],
  );

  const handleSearchClear = useCallback(() => {
    commitStagedHides().catch(() => undefined);
    setSearchQuery('');
  }, [commitStagedHides]);

  const networkFilterLabel = useMemo(() => {
    const enabledCount = enabledChainIds.length;
    if (enabledCount === 0) {
      return t('noNetworksSelected');
    }
    if (enabledCount === 1) {
      const onlyChain = enabledChainIds[0];
      const evmName = networkConfigurations?.[onlyChain]?.name;
      const multichainName =
        allMultichainNetworkConfigurations?.[onlyChain as CaipChainId]?.name;
      return (
        evmName ?? multichainName ?? currentNetwork?.name ?? t('currentNetwork')
      );
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    commitStagedHidesRef.current = async () => {
      if (stagedHidesRef.current.size === 0) {
        return;
      }
      const entries = Array.from(stagedHidesRef.current.entries());
      stagedHidesRef.current.clear();
      if (isMountedRef.current) {
        setStagedHideKeys(new Set());
        addCommittedHideKeys(entries.map(([key]) => key));
      }

      await Promise.allSettled(
        entries.map(async ([, entry]) => {
          if (entry.kind === 'evm') {
            const { networkClientId } = getNetworkMeta(entry.hexChainId);
            if (!networkClientId) {
              return;
            }
            await dispatch(
              ignoreTokensAction({
                tokensToIgnore: [entry.address],
                dontShowLoadingIndicator: true,
                networkClientId,
              }),
            );
            if (isAssetsUnifiedStateInBuild && entry.caipAssetId) {
              await dispatch(hideAsset(entry.caipAssetId));
            }
            return;
          }
          await dispatch(
            multichainIgnoreAssets([entry.assetId], entry.accountId),
          );
          if (isAssetsUnifiedStateInBuild) {
            await dispatch(hideAsset(entry.assetId));
          }
        }),
      );
    };
  }, [
    addCommittedHideKeys,
    dispatch,
    getNetworkMeta,
    isAssetsUnifiedStateInBuild,
  ]);

  useEffect(() => {
    return () => {
      commitStagedHidesRef.current().catch(() => undefined);
    };
  }, []);

  /**
   * Visible-list toggle. Hides are staged in local state so the row stays
   * visible (and restorable) until the user leaves the page. Re-toggling a
   * staged-off row simply unstages it — no dispatch ever fires for that
   * intermediate state.
   */
  const handleToggle = useCallback(
    (token: ManagedAsset, nextValue: boolean) => {
      const isNativeToken = Boolean(token.isNative);
      if (isNativeToken) {
        return;
      }

      const isEvmToken = isEvmChainId(token.chainId as Hex | CaipChainId);
      const canIgnoreEvmToken = isEvmToken && 'address' in token;
      const canIgnoreMultichainToken =
        !isEvmToken && Boolean(token.assetId) && Boolean(token.accountId);
      if (!canIgnoreEvmToken && !canIgnoreMultichainToken) {
        return;
      }

      const stagedKey = getStagedHideKey(token);
      if (!stagedKey) {
        return;
      }

      if (nextValue) {
        unstageHide(stagedKey);
        return;
      }

      if (canIgnoreEvmToken) {
        const { networkClientId } = getNetworkMeta(token.chainId as Hex);
        if (!networkClientId) {
          return;
        }
        const caipAssetId = toAssetId(
          token.address as Hex,
          token.chainId as Hex,
        );
        stageHide(stagedKey, {
          kind: 'evm',
          hexChainId: token.chainId as Hex,
          address: token.address,
          caipAssetId: caipAssetId ?? undefined,
        });
        return;
      }

      stageHide(stagedKey, {
        kind: 'multichain',
        assetId: token.assetId as CaipAssetType,
        accountId: token.accountId,
      });
    },
    [getNetworkMeta, getStagedHideKey, stageHide, unstageHide],
  );

  /**
   * Search-result-specific toggle. Imports (toggle ON for a never-imported
   * result) still dispatch immediately so the user sees the asset land in
   * the list. Hides (toggle OFF for an already-imported result) are staged
   * just like the visible-list toggle, so flipping the row back ON before
   * leaving the page restores it without ever dispatching a hide.
   *
   * Mirrors the mobile dual-dispatch contract (`metamask-mobile#26108`):
   *
   * - EVM result, toggle ON (fresh) → `addImportedTokens` + `addCustomAsset`.
   * - Non-EVM result, toggle ON (fresh) → `multichainAddAssets`
   * + `addCustomAsset`.
   * - Toggle OFF (any) → stage hide; commit fires on unmount.
   *
   * `addCustomAsset` only fires when the unified AssetsController is
   * included in the build (`ASSETS_UNIFIED_STATE_ENABLED`).
   *
   * Native assets are not importable — the toggle never reaches this handler
   * for them, but we guard here too so a buggy API response can't dispatch
   * a malformed payload.
   */
  const handleSearchResultToggle = useCallback(
    async (payload: SearchResultImportPayload, nextValue: boolean) => {
      if (payload.isNative) {
        return;
      }

      const stagedKey = payload.assetId.toLowerCase();

      if (!nextValue) {
        if (payload.isEvm) {
          if (!payload.hexChainId) {
            return;
          }
          const { networkClientId } = getNetworkMeta(payload.hexChainId);
          if (!networkClientId) {
            return;
          }
          stageHide(stagedKey, {
            kind: 'evm',
            hexChainId: payload.hexChainId,
            address: payload.assetReference,
            caipAssetId: payload.assetId,
          });
          return;
        }

        const account = getAccountForChain(payload.caipChainId);
        if (!account?.id) {
          return;
        }
        stageHide(stagedKey, {
          kind: 'multichain',
          assetId: payload.assetId,
          accountId: account.id,
        });
        return;
      }

      if (unstageHide(stagedKey)) {
        return;
      }
      removeCommittedHideKey(stagedKey);

      addPendingKey(stagedKey);
      try {
        if (payload.isEvm) {
          if (!payload.hexChainId) {
            return;
          }
          const { networkClientId } = getNetworkMeta(payload.hexChainId);
          if (!networkClientId) {
            return;
          }
          const evmAccount = getAccountForChain(payload.caipChainId);
          if (!evmAccount?.id) {
            return;
          }
          await dispatch(
            addImportedTokens(
              [
                {
                  address: payload.assetReference,
                  symbol: payload.symbol,
                  decimals: payload.decimals,
                  isERC721: false,
                  name: payload.name,
                  ...(payload.iconUrl ? { image: payload.iconUrl } : {}),
                },
              ],
              networkClientId,
            ),
          );
          if (isAssetsUnifiedStateInBuild) {
            await dispatch(addCustomAsset(evmAccount.id, payload.assetId));
          }
          return;
        }

        const account = getAccountForChain(payload.caipChainId);
        if (!account?.id) {
          return;
        }
        await dispatch(multichainAddAssets([payload.assetId], account.id));
        if (isAssetsUnifiedStateInBuild) {
          await dispatch(addCustomAsset(account.id, payload.assetId));
        }
      } finally {
        removePendingKey(stagedKey);
      }
    },
    [
      addPendingKey,
      dispatch,
      getAccountForChain,
      getNetworkMeta,
      isAssetsUnifiedStateInBuild,
      removePendingKey,
      removeCommittedHideKey,
      stageHide,
      unstageHide,
    ],
  );

  const handleBack = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      commitStagedHides()
        .catch(() => undefined)
        .finally(() => navigate(DEFAULT_ROUTE));
    },
    [commitStagedHides, navigate],
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
      const stagedKey = getStagedHideKey(token);
      const isHidden = stagedKey
        ? stagedHideKeys.has(stagedKey) || committedHideKeys.has(stagedKey)
        : false;
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
          isOn={!isHidden}
          disabled={isNativeToken || pendingKeys.has(key)}
          onToggle={(nextValue) => handleToggle(token, nextValue)}
          showToggle={isManageableToken || isNativeToken}
          testIdSuffix={key}
        />
      );
    },
    [
      committedHideKeys,
      getStagedHideKey,
      getTokenImage,
      getTokenKey,
      handleToggle,
      pendingKeys,
      stagedHideKeys,
    ],
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
      const payload = convertSearchResultToImportPayload(result);

      if (!payload) {
        return null;
      }

      const evmImportedKey = payload.hexChainId
        ? `${payload.hexChainId}:${payload.assetReference.toLowerCase()}`
        : undefined;
      const isImported =
        importedAssetIds.has(lowerAssetId) ||
        (evmImportedKey ? importedAssetIds.has(evmImportedKey) : false);
      const accountIdForChain = payload.isEvm
        ? undefined
        : getAccountForChain(payload.caipChainId)?.id;
      const isIgnoredMultichainAsset = payload.isEvm
        ? false
        : Boolean(
            accountIdForChain &&
              allIgnoredAssetsByAccount[accountIdForChain]?.some(
                (assetId) => String(assetId).toLowerCase() === lowerAssetId,
              ),
          );
      const isHidden =
        stagedHideKeys.has(lowerAssetId) ||
        committedHideKeys.has(lowerAssetId) ||
        ignoredEvmAssetIds.has(lowerAssetId) ||
        (evmImportedKey ? ignoredEvmAssetIds.has(evmImportedKey) : false) ||
        isIgnoredMultichainAsset;

      return (
        <TokenManagementCell
          symbol={payload.symbol}
          image={payload.iconUrl || undefined}
          chainId={
            (payload.hexChainId ?? payload.caipChainId) as Hex | CaipChainId
          }
          isNative={payload.isNative}
          assetId={payload.assetId}
          primaryLabel={payload.name || payload.symbol}
          secondaryLabel={
            networkConfigurations?.[payload.hexChainId as Hex]?.name ??
            allMultichainNetworkConfigurations?.[payload.caipChainId]?.name ??
            payload.caipChainId
          }
          isOn={(isImported && !isHidden) || payload.isNative}
          disabled={payload.isNative || pendingKeys.has(lowerAssetId)}
          onToggle={(nextValue) => handleSearchResultToggle(payload, nextValue)}
          showToggle={!payload.isNative}
          testIdSuffix={`search-${lowerAssetId}`}
        />
      );
    },
    [
      allMultichainNetworkConfigurations,
      allIgnoredAssetsByAccount,
      committedHideKeys,
      getAccountForChain,
      handleSearchResultToggle,
      ignoredEvmAssetIds,
      importedAssetIds,
      networkConfigurations,
      pendingKeys,
      stagedHideKeys,
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
    <Link to={DEFAULT_ROUTE} aria-label={t('back')} onClick={handleBack}>
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
        <TextFieldSearch
          value={searchQuery}
          placeholder={t('enterTokenNameOrAddressManageTokens')}
          onChange={handleSearchChange}
          clearButtonOnClick={handleSearchClear}
          size={TextFieldSearchSize.Lg}
          className="w-full"
          inputProps={{
            'data-testid': 'token-management-search-input',
            spellCheck: false,
          }}
        />
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
            {!isSearching && searchError && !hasResults
              ? searchErrorState
              : null}
            {hasResults || (!isSearching && !searchError) ? (
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
