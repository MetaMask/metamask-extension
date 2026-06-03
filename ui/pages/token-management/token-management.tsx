import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  IconColor,
  IconName,
  IconSize,
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
import { ERC20 } from '@metamask/controller-utils';

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
  TOKEN_MANAGEMENT_ROUTE,
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
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';

type ManagedAsset = Parameters<typeof sortAssetsWithPriority>[0][number];

type EvmToken = {
  address: string;
  symbol?: string;
  decimals?: number;
  name?: string;
  image?: string;
};

const SEARCH_DEBOUNCE_MS = 300;
const TOKEN_MANAGEMENT_PAGE_TOAST_DURATION_MS = 5000;
const TOKEN_LIST_PAGINATION_THRESHOLD_PX = ASSET_CELL_HEIGHT * 4;
const EMPTY_TOKEN_SEARCH_RESULTS: TokenSearchResult[] = [];
const TOKEN_MANAGEMENT_SCREEN = 'manage_tokens';
const TOKEN_MANAGEMENT_DEFAULT_VIEW_STATE = 'default';
const TOKEN_MANAGEMENT_NO_RESULTS_VIEW_STATE = 'no_results';
const TOKEN_MANAGEMENT_LOCATION = 'MANAGE_TOKENS';
const TOKEN_MANAGEMENT_CUSTOM_CTA_LOCATION = 'MANAGE_TOKENS_CUSTOM_CTA';
const METRICS_PROPERTIES = {
  assetType: 'asset_type',
  chainId: 'chain_id',
  sourceConnectionMethod: 'source_connection_method',
  tokenContractAddress: 'token_contract_address',
  tokenDecimalPrecision: 'token_decimal_precision',
  tokenStandard: 'token_standard',
  tokenSymbol: 'token_symbol',
  viewState: 'view_state',
} as const;

type TokenManagementRouteState = {
  tokenManagementToast?: {
    type: 'customTokenAdded';
    symbol: string;
  };
};

type TokenManagementListItem =
  | {
      type: 'managed';
      token: ManagedAsset;
    }
  | {
      type: 'api-result';
      result: TokenSearchResult;
    };

const getTokenManagementToastFromRouteState = (state: unknown) => {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const toast = (state as TokenManagementRouteState).tokenManagementToast;
  if (toast?.type !== 'customTokenAdded' || !toast.symbol) {
    return null;
  }

  return {
    symbol: toast.symbol,
  };
};

const getAssetReferenceFromAssetId = (assetId: unknown): string | undefined => {
  if (!assetId || typeof assetId !== 'string') {
    return undefined;
  }

  const assetType = assetId.split('/').pop();
  const assetReference = assetType?.split(':').pop();
  return assetReference || assetId;
};

const getManagedTokenMetricsProperties = (token: ManagedAsset) => {
  const isEvmToken = isEvmChainId(token.chainId as Hex | CaipChainId);
  const address =
    'address' in token && token.address
      ? token.address
      : getAssetReferenceFromAssetId(token.assetId);
  const properties: Record<string, string | number> = {
    [METRICS_PROPERTIES.chainId]: String(token.chainId),
    [METRICS_PROPERTIES.tokenStandard]: isEvmToken ? ERC20 : TokenStandard.none,
    [METRICS_PROPERTIES.assetType]: AssetType.token,
  };

  if (token.symbol) {
    properties[METRICS_PROPERTIES.tokenSymbol] = token.symbol;
  }
  if (address) {
    properties[METRICS_PROPERTIES.tokenContractAddress] = address;
  }
  if (typeof token.decimals === 'number') {
    properties[METRICS_PROPERTIES.tokenDecimalPrecision] = token.decimals;
  }

  return properties;
};

const normalizeToHexChainId = (chainId: string): string => {
  if (!chainId.startsWith('eip155:')) {
    return chainId.toLowerCase();
  }

  const decimalChainId = Number(chainId.split(':')[1]);
  return Number.isFinite(decimalChainId)
    ? `0x${decimalChainId.toString(16)}`.toLowerCase()
    : chainId.toLowerCase();
};

const normalizeToCaipChainId = (chainId: string): CaipChainId =>
  chainId.startsWith('0x')
    ? formatChainIdToCaip(chainId as Hex)
    : (chainId as CaipChainId);

const getTokenAddressKey = (chainId: string, address: string) =>
  `${normalizeToHexChainId(chainId)}:${address.toLowerCase()}`;

const getIgnoredTokenAddressesByChain = (
  allIgnoredTokensByChain: Record<string, Record<string, string[]>>,
  selectedAddress?: string,
) => {
  const ignoredTokenAddressesByChain = new Map<string, Set<string>>();

  if (!selectedAddress) {
    return ignoredTokenAddressesByChain;
  }

  const lowercasedSelectedAddress = selectedAddress.toLowerCase();
  Object.entries(allIgnoredTokensByChain ?? {}).forEach(
    ([chainId, tokensByAddress]) => {
      const hexChainId = normalizeToHexChainId(chainId);
      Object.entries(tokensByAddress ?? {}).forEach(
        ([accountAddress, tokenAddresses]) => {
          if (accountAddress.toLowerCase() !== lowercasedSelectedAddress) {
            return;
          }

          const ignoredAddresses =
            ignoredTokenAddressesByChain.get(hexChainId) ?? new Set<string>();
          tokenAddresses.forEach((tokenAddress) =>
            ignoredAddresses.add(tokenAddress.toLowerCase()),
          );
          ignoredTokenAddressesByChain.set(hexChainId, ignoredAddresses);
        },
      );
    },
  );

  return ignoredTokenAddressesByChain;
};

const toManagedEvmToken = (token: EvmToken, hexChainId: string): ManagedAsset =>
  ({
    accountId: '',
    accountType: 'eip155:eoa',
    assetId:
      toAssetId(token.address as Hex, hexChainId as Hex) ?? token.address,
    address: token.address,
    chainId: hexChainId,
    image: token.image ?? '',
    name: token.name ?? token.symbol ?? token.address,
    symbol: token.symbol ?? '',
    decimals: token.decimals ?? 0,
    isNative: false,
    rawBalance: '0x0',
    balance: '0',
    fiat: {
      balance: 0,
      currency: 'usd',
      conversionRate: 0,
    },
  }) as ManagedAsset;

const getImportedTokensWithoutBalances = ({
  allTokensByChain,
  allIgnoredTokensByChain,
  enabledChainIds,
  selectedAddress,
  seenKeys,
}: {
  allTokensByChain: Record<string, Record<string, EvmToken[]>>;
  allIgnoredTokensByChain: Record<string, Record<string, string[]>>;
  enabledChainIds: string[];
  selectedAddress?: string;
  seenKeys: Set<string>;
}): ManagedAsset[] => {
  if (!selectedAddress) {
    return [];
  }

  const ignoredAddressesByChain = getIgnoredTokenAddressesByChain(
    allIgnoredTokensByChain,
    selectedAddress,
  );
  const lowercasedSelectedAddress = selectedAddress.toLowerCase();

  return Object.entries(allTokensByChain ?? {}).flatMap(
    ([chainId, tokensByAddress]) => {
      const hexChainId = normalizeToHexChainId(chainId);
      if (!enabledChainIds.includes(hexChainId)) {
        return [];
      }

      return Object.entries(tokensByAddress ?? {}).flatMap(
        ([accountAddress, tokens]) => {
          if (accountAddress.toLowerCase() !== lowercasedSelectedAddress) {
            return [];
          }

          return tokens.flatMap((token) => {
            if (!token?.address) {
              return [];
            }

            const lowercasedAddress = token.address.toLowerCase();
            const key = getTokenAddressKey(hexChainId, lowercasedAddress);
            if (
              seenKeys.has(key) ||
              ignoredAddressesByChain.get(hexChainId)?.has(lowercasedAddress)
            ) {
              return [];
            }

            seenKeys.add(key);
            return [toManagedEvmToken(token, hexChainId)];
          });
        },
      );
    },
  );
};

export const TokenManagementPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackEvent } = useContext(MetaMetricsContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [pageToast, setPageToast] = useState<{ symbol: string } | null>(null);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const dismissPageToast = useCallback(() => setPageToast(null), []);

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
  const [committedHideKeys, setCommittedHideKeys] = useState<
    ReadonlySet<string>
  >(() => new Set<string>());
  const stagedHidesRef = useRef<Map<string, StagedHidePayload>>(new Map());
  const hasTrackedScreenOpenedRef = useRef(false);

  const stageHide = useCallback((key: string, payload: StagedHidePayload) => {
    stagedHidesRef.current.set(key, payload);
    setStagedHideKeys(new Set(stagedHidesRef.current.keys()));
  }, []);

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

  const getStagedHideKey = useCallback((token: ManagedAsset): string | null => {
    if (isEvmChainId(token.chainId as Hex | CaipChainId)) {
      if (!('address' in token) || !token.address) {
        return null;
      }
      const caip = toAssetId(token.address as Hex, token.chainId as Hex);
      return caip ? caip.toLowerCase() : null;
    }
    return token.assetId ? String(token.assetId).toLowerCase() : null;
  }, []);

  const commitStagedHidesRef = useRef<() => Promise<void>>(
    async () => undefined,
  );

  const isMountedRef = useRef(true);

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
  const allMultichainNetworkConfigurations = useSelector(
    getAllMultichainNetworkConfigurations,
  );
  const allTokensByChain = useSelector(getTokensControllerAllTokens) as Record<
    string,
    Record<string, EvmToken[]>
  >;
  const allIgnoredTokensByChain = useSelector(
    getTokensControllerAllIgnoredTokens,
  ) as Record<string, Record<string, string[]>>;
  const allIgnoredAssetsByAccount = useSelector(
    getMultiChainAssetsControllerAllIgnoredAssets,
  ) as Record<string, CaipAssetType[]>;
  const selectedAddress = useSelector(getSelectedAddress) as string | undefined;

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
      const key = getTokenAddressKey(String(asset.chainId), String(id));
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      dedupedAssets.push(asset);
    });

    dedupedAssets.push(
      ...getImportedTokensWithoutBalances({
        allTokensByChain,
        allIgnoredTokensByChain,
        enabledChainIds: allEnabledNetworksForAllNamespaces,
        selectedAddress,
        seenKeys: seen,
      }),
    );

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
    allIgnoredTokensByChain,
    allTokensByChain,
    currentNetwork?.chainId,
    isEvm,
    selectedAddress,
    shouldHideZeroBalanceTokens,
    tokenSortConfig,
    useExternalServices,
  ]);

  const normalizedSearchQuery = searchQuery.trim();
  const hasQuery = normalizedSearchQuery.length > 0;
  const debouncedSearchQuery = useDebouncedValue(
    normalizedSearchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const tokenSearchQuery = hasQuery ? debouncedSearchQuery : '';

  const searchNetworks = useMemo(() => {
    if (allEnabledNetworksForAllNamespaces.length === 0) {
      return undefined;
    }
    return allEnabledNetworksForAllNamespaces.map(normalizeToCaipChainId);
  }, [allEnabledNetworksForAllNamespaces]);

  const {
    data: searchResponse,
    isFetching: isSearchFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: searchQueryError,
  } = useTokenSearch({
    query: tokenSearchQuery,
    networks: searchNetworks,
    enableTokenBrowse: !hasQuery,
  });

  const isWaitingForDebounce =
    hasQuery && normalizedSearchQuery !== debouncedSearchQuery;

  const apiTokenResults = useMemo(() => {
    if (hasQuery && debouncedSearchQuery.length === 0) {
      return EMPTY_TOKEN_SEARCH_RESULTS;
    }

    return searchResponse?.data ?? EMPTY_TOKEN_SEARCH_RESULTS;
  }, [debouncedSearchQuery.length, hasQuery, searchResponse?.data]);
  const searchResults = useMemo(
    () => (hasQuery ? apiTokenResults : EMPTY_TOKEN_SEARCH_RESULTS),
    [apiTokenResults, hasQuery],
  );
  const hasResults = searchResults.length > 0;
  const isSearching =
    isWaitingForDebounce ||
    (hasQuery && debouncedSearchQuery.length > 0 && isSearchFetching);
  const searchError = hasQuery ? searchQueryError : null;

  const importedEvmTokensByChain = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!selectedAddress) {
      return map;
    }
    const lowercasedSelected = selectedAddress.toLowerCase();
    Object.entries(allTokensByChain ?? {}).forEach(
      ([chainId, tokensByAddress]) => {
        const hexChainId = normalizeToHexChainId(chainId);
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
  }, [allTokensByChain, selectedAddress]);

  const importedAssetIds = useMemo(() => {
    const set = new Set<string>();
    visibleTokens.forEach((token) => {
      if (token.assetId) {
        set.add(String(token.assetId).toLowerCase());
      }
      if ('address' in token && token.address && token.chainId) {
        set.add(
          `${normalizeToHexChainId(String(token.chainId))}:${String(
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
  }, [importedEvmTokensByChain, visibleTokens]);

  const ignoredEvmAssetIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedAddress) {
      return set;
    }

    const lowercasedSelectedAddress = selectedAddress.toLowerCase();
    Object.entries(allIgnoredTokensByChain ?? {}).forEach(
      ([chainId, tokensByAddress]) => {
        const hexChainId = normalizeToHexChainId(chainId);
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
  }, [allIgnoredTokensByChain, selectedAddress]);

  const handleOpenNetworkFilter = useCallback(() => {
    commitStagedHides().catch(() => undefined);
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
  }, [commitStagedHides, dispatch]);

  const handleAddCustomToken = useCallback(() => {
    commitStagedHides().catch(() => undefined);
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.TokenImportButtonClicked,
      properties: {
        location: TOKEN_MANAGEMENT_CUSTOM_CTA_LOCATION,
      },
    });
    navigate(CUSTOM_TOKEN_IMPORT_ROUTE);
  }, [commitStagedHides, navigate, trackEvent]);

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
    const toast = getTokenManagementToastFromRouteState(location.state);
    if (!toast) {
      return;
    }

    setPageToast(toast);
    navigate(TOKEN_MANAGEMENT_ROUTE, { replace: true, state: null });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!pageToast) {
      return undefined;
    }

    const timeoutId = setTimeout(
      dismissPageToast,
      TOKEN_MANAGEMENT_PAGE_TOAST_DURATION_MS,
    );

    return () => clearTimeout(timeoutId);
  }, [dismissPageToast, pageToast]);

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
      const tokenMetricsProperties = getManagedTokenMetricsProperties(token);

      if (nextValue) {
        unstageHide(stagedKey);
        trackEvent({
          category: MetaMetricsEventCategory.Wallet,
          event: MetaMetricsEventName.TokenAdded,
          sensitiveProperties: {
            ...tokenMetricsProperties,
            [METRICS_PROPERTIES.sourceConnectionMethod]:
              MetaMetricsTokenEventSource.ManageTokens,
          },
        });
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
        trackEvent({
          category: MetaMetricsEventCategory.Wallet,
          event: MetaMetricsEventName.TokenHidden,
          sensitiveProperties: {
            ...tokenMetricsProperties,
            location: TOKEN_MANAGEMENT_LOCATION,
          },
        });
        return;
      }

      stageHide(stagedKey, {
        kind: 'multichain',
        assetId: token.assetId as CaipAssetType,
        accountId: token.accountId,
      });
      trackEvent({
        category: MetaMetricsEventCategory.Wallet,
        event: MetaMetricsEventName.TokenHidden,
        sensitiveProperties: {
          ...tokenMetricsProperties,
          location: TOKEN_MANAGEMENT_LOCATION,
        },
      });
    },
    [getNetworkMeta, getStagedHideKey, stageHide, trackEvent, unstageHide],
  );

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
          await Promise.all([
            dispatch(
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
            ),
            ...(isAssetsUnifiedStateInBuild
              ? [dispatch(addCustomAsset(evmAccount.id, payload.assetId))]
              : []),
          ]);

          return;
        }

        const account = getAccountForChain(payload.caipChainId);
        if (!account?.id) {
          return;
        }

        await Promise.all([
          dispatch(multichainAddAssets([payload.assetId], account.id)),
          ...(isAssetsUnifiedStateInBuild
            ? [dispatch(addCustomAsset(account.id, payload.assetId))]
            : []),
        ]);
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
      const isPending = pendingKeys.has(lowerAssetId);

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
          isOn={isPending || (isImported && !isHidden) || payload.isNative}
          disabled={payload.isNative || isPending}
          isLoading={isPending}
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

  const visibleTokenAssetIds = useMemo(() => {
    const set = new Set<string>();

    visibleTokens.forEach((token) => {
      if (token.assetId) {
        set.add(String(token.assetId).toLowerCase());
      }

      if ('address' in token && token.address && token.chainId) {
        const hexChainId = normalizeToHexChainId(String(token.chainId));
        const address = String(token.address).toLowerCase();
        set.add(`${hexChainId}:${address}`);

        const caipAssetId = toAssetId(token.address as Hex, hexChainId as Hex);
        if (caipAssetId) {
          set.add(caipAssetId.toLowerCase());
        }
      }
    });

    return set;
  }, [visibleTokens]);

  const getSearchResultAssetKeys = useCallback((result: TokenSearchResult) => {
    const keys = [result.assetId.toLowerCase()];
    const payload = convertSearchResultToImportPayload(result);

    if (payload?.hexChainId) {
      keys.push(
        `${payload.hexChainId}:${payload.assetReference.toLowerCase()}`,
      );
    }

    return keys;
  }, []);

  const browseApiResults = useMemo(() => {
    if (hasQuery) {
      return [];
    }

    return apiTokenResults.filter((result) =>
      getSearchResultAssetKeys(result).every(
        (key) => !visibleTokenAssetIds.has(key),
      ),
    );
  }, [
    apiTokenResults,
    getSearchResultAssetKeys,
    hasQuery,
    visibleTokenAssetIds,
  ]);

  const tokenListItems = useMemo<TokenManagementListItem[]>(() => {
    if (hasQuery) {
      return searchResults.map((result) => ({
        type: 'api-result',
        result,
      }));
    }

    return [
      ...visibleTokens.map((token) => ({
        type: 'managed' as const,
        token,
      })),
      ...browseApiResults.map((result) => ({
        type: 'api-result' as const,
        result,
      })),
    ];
  }, [browseApiResults, hasQuery, searchResults, visibleTokens]);
  const tokenManagementViewState =
    tokenListItems.length === 0
      ? TOKEN_MANAGEMENT_NO_RESULTS_VIEW_STATE
      : TOKEN_MANAGEMENT_DEFAULT_VIEW_STATE;

  useEffect(() => {
    if (
      hasTrackedScreenOpenedRef.current ||
      isSearchFetching ||
      isSearching ||
      isFetchingNextPage
    ) {
      return;
    }

    hasTrackedScreenOpenedRef.current = true;
    trackEvent({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.TokenScreenOpened,
      properties: {
        screen: TOKEN_MANAGEMENT_SCREEN,
        [METRICS_PROPERTIES.viewState]: tokenManagementViewState,
      },
    });
  }, [
    isFetchingNextPage,
    isSearchFetching,
    isSearching,
    tokenManagementViewState,
    trackEvent,
  ]);

  const renderTokenListItem = useCallback(
    (info: { item: TokenManagementListItem }) => {
      if (info.item.type === 'managed') {
        return renderToken({ item: info.item.token });
      }

      return renderSearchResult({ item: info.item.result });
    },
    [renderSearchResult, renderToken],
  );

  const getTokenListItemKey = useCallback(
    (item: TokenManagementListItem, index: number) => {
      if (item.type === 'managed') {
        return `managed-${getTokenKey(item.token)}`;
      }

      return `${getSearchResultKey(item.result)}-${index}`;
    },
    [getSearchResultKey, getTokenKey],
  );

  const handleListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;

      if (
        !hasNextPage ||
        isSearchFetching ||
        isFetchingNextPage ||
        searchError
      ) {
        return;
      }

      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (
        scrollTop > 0 &&
        distanceFromBottom <= TOKEN_LIST_PAGINATION_THRESHOLD_PX
      ) {
        fetchNextPage().catch(() => undefined);
      }
    },
    [
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isSearchFetching,
      searchError,
    ],
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
      aria-label={t('loading')}
      data-testid="token-management-search-loading"
    >
      <Icon
        className="animate-spin"
        name={IconName.Loading}
        color={IconColor.IconMuted}
        size={IconSize.Lg}
      />
    </Box>
  );

  const paginationLoadingState = isFetchingNextPage ? (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      padding={4}
      aria-label={t('loading')}
      data-testid="token-management-pagination-loading"
    >
      <Icon
        className="animate-spin"
        name={IconName.Loading}
        color={IconColor.IconMuted}
        size={IconSize.Sm}
      />
    </Box>
  ) : null;

  const shouldShowTokenList = hasQuery
    ? hasResults || (!isSearching && !searchError)
    : tokenListItems.length > 0 || !isSearchFetching;

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
        onScroll={handleListScroll}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        {hasQuery && isSearching && !hasResults ? loadingState : null}
        {hasQuery && !isSearching && searchError && !hasResults
          ? searchErrorState
          : null}
        {!hasQuery && isSearchFetching && tokenListItems.length === 0
          ? loadingState
          : null}
        {shouldShowTokenList ? (
          <VirtualizedList
            data={tokenListItems}
            estimatedItemSize={ASSET_CELL_HEIGHT}
            overscan={10}
            keyExtractor={getTokenListItemKey}
            listEmptyComponent={emptyState}
            listFooterComponent={paginationLoadingState}
            renderItem={renderTokenListItem}
          />
        ) : null}
      </ScrollContainer>

      {pageToast || canImportCustomTokens ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          paddingHorizontal={4}
          paddingTop={3}
          paddingBottom={3}
          className="sticky bottom-0 z-10 gap-3"
        >
          {pageToast ? (
            <Box
              data-testid="token-management-custom-token-success-toast"
              className="flex w-full items-center gap-3 rounded-xl border border-border-muted bg-background-section p-3"
            >
              <Icon
                name={IconName.Confirmation}
                size={IconSize.Md}
                color={IconColor.SuccessDefault}
              />
              <Text variant={TextVariant.BodyMd} className="flex-1">
                {t('newCustomTokenAdded', [pageToast.symbol])}
              </Text>
              <ButtonIcon
                ariaLabel={t('close')}
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                onClick={dismissPageToast}
              />
            </Box>
          ) : null}
          {canImportCustomTokens ? (
            <ButtonBase
              data-testid="token-management-add-custom-token-button"
              className="w-full bg-muted text-default hover:bg-muted-hover active:bg-muted-pressed"
              onClick={handleAddCustomToken}
            >
              {t('addCustomToken')}
            </ButtonBase>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

export default TokenManagementPage;
