import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  BannerBase,
  Box,
  BoxBackgroundColor,
  FontWeight,
  Text,
  TextAlign,
  TextButton,
  TextButtonSize,
  TextColor,
  TextFieldSearch,
  TextVariant,
} from '@metamask/design-system-react';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import {
  type SafeChain,
  useSafeChains,
} from '../../components/multichain/networks-form/use-safe-chains';
import ToggleButton from '../../components/ui/toggle-button';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getIsTestnetInUse, getShouldShowTestNetworks } from '../../selectors';
import { setShowTestNetworksPreference } from '../../store/actions';
import { useDispatch } from '../../store/hooks';
import { NoSearchResult } from './no-search-result';

export type ChainlistNetwork = SafeChain & {
  chain?: string;
  chainId: string | number;
  explorers?: { url?: string }[];
};

export const getHexChainId = (chainId: string | number) =>
  `0x${Number(chainId).toString(16)}`.toLowerCase();

export const ChainlistSourceBanner = ({
  description,
  learnMoreTabIndex,
  onLearnMoreMouseDown,
  testId,
}: {
  description: (learnMore: React.ReactNode) => React.ReactNode;
  /** Removes the learn-more link from the tab order inside a suggestion list. */
  learnMoreTabIndex?: number;
  onLearnMoreMouseDown?: (event: React.MouseEvent) => void;
  testId: string;
}) => {
  const t = useI18nContext();

  return (
    <BannerBase
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      data-testid={testId}
      description={
        <Text variant={TextVariant.BodySm}>
          {description(
            <TextButton
              key="chainlist-learn-how-to-stay-safe"
              onClick={() => {
                global.platform.openTab({ url: ZENDESK_URLS.UNKNOWN_NETWORK });
              }}
              onMouseDown={onLearnMoreMouseDown}
              size={TextButtonSize.BodySm}
              tabIndex={learnMoreTabIndex}
            >
              {t('chainlistLearnHowToStaySafe')}
            </TextButton>,
          )}
        </Text>
      }
    />
  );
};

export const getUsableUrls = (urls: string[] = []) =>
  urls.filter((url) => {
    if (!url || url.includes('${')) {
      return false;
    }

    try {
      const { protocol } = new URL(url);
      return protocol === 'https:';
    } catch {
      return false;
    }
  });

const CHAINLIST_PAGE_SIZE = 100;
const CHAINLIST_SCROLL_THRESHOLD_PX = 120;
const BUILT_IN_TEST_CHAIN_IDS = new Set(
  TEST_CHAINS.map((chainId) => chainId.toLowerCase()),
);

/**
 * Keeps Chainlist's order inside each group, and puts chains that have a
 * built-in logo ahead of chains that only show a letter.
 *
 * @param networks - Chainlist rows in their original order.
 */
const sortChainlistNetworksWithLogosFirst = (
  networks: ChainlistNetwork[],
): ChainlistNetwork[] => {
  const networksWithLogos: ChainlistNetwork[] = [];
  const networksWithoutLogos: ChainlistNetwork[] = [];

  for (const network of networks) {
    if (getHexChainId(network.chainId) in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP) {
      networksWithLogos.push(network);
    } else {
      networksWithoutLogos.push(network);
    }
  }

  return [...networksWithLogos, ...networksWithoutLogos];
};

type ChainlistNetworkPickerProps = {
  existingNetworkChainIds: Set<string>;
  existingNetworkNamesByChainId: Record<string, string>;
  onSelect: (network: ChainlistNetwork, searchQuery?: string) => void;
  /**
   * Keeps the typed name and closes the dropdown when Chainlist has no match.
   */
  onUseTypedName?: (name: string) => void;
  /**
   * When false, the picker filters on `searchValue` from the parent field
   * instead of rendering its own search input.
   */
  showSearchField?: boolean;
  searchValue?: string;
  /** `dropdown` caps the list so it can sit under the network name field. */
  layout?: 'page' | 'dropdown';
  /** Pixel height available below the field the dropdown is anchored to. */
  maxHeight?: number;
  /**
   * Id of the text field this dropdown suggests for. Arrow keys move the
   * highlight while focus stays in that field.
   */
  comboboxInputId?: string;
  /** Closes the suggestion list, for example when Escape is pressed. */
  onDismiss?: () => void;
};

export const ChainlistNetworkPicker = ({
  existingNetworkChainIds,
  existingNetworkNamesByChainId,
  onSelect,
  onUseTypedName,
  showSearchField = true,
  searchValue: searchValueProp = '',
  layout = 'page',
  maxHeight,
  comboboxInputId,
  onDismiss,
}: ChainlistNetworkPickerProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const searchValue = showSearchField ? internalSearchValue : searchValueProp;
  const [visibleNetworkCount, setVisibleNetworkCount] =
    useState(CHAINLIST_PAGE_SIZE);
  const { safeChains } = useSafeChains();
  const showTestNetworks = useSelector(getShouldShowTestNetworks);
  const currentlyOnTestnet = useSelector(getIsTestnetInUse);

  const { chainlistNetworks, defaultTestnets } = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();
    const networks: ChainlistNetwork[] = [];
    const testnets: ChainlistNetwork[] = [];

    for (const network of (safeChains ?? []) as ChainlistNetwork[]) {
      const chainId = getHexChainId(network.chainId);
      const existingNetworkName = existingNetworkNamesByChainId[chainId];
      if (getUsableUrls(network.rpc).length === 0) {
        continue;
      }

      const matchesSearch =
        !normalizedSearchValue ||
        network.name.toLowerCase().includes(normalizedSearchValue) ||
        existingNetworkName?.toLowerCase().includes(normalizedSearchValue) ||
        String(network.chainId).includes(normalizedSearchValue);

      if (!matchesSearch) {
        continue;
      }

      if (BUILT_IN_TEST_CHAIN_IDS.has(chainId)) {
        testnets.push(network);
      } else {
        networks.push(network);
      }
    }

    return {
      chainlistNetworks:
        layout === 'dropdown'
          ? sortChainlistNetworksWithLogosFirst(networks)
          : networks,
      defaultTestnets: testnets,
    };
  }, [existingNetworkNamesByChainId, layout, safeChains, searchValue]);

  const visibleChainlistNetworks = useMemo(
    () => chainlistNetworks.slice(0, visibleNetworkCount),
    [chainlistNetworks, visibleNetworkCount],
  );
  const showNoSearchResults =
    searchValue.trim().length > 0 &&
    chainlistNetworks.length === 0 &&
    defaultTestnets.length === 0;

  const handleToggleTestNetworks = useCallback(
    (value: boolean) => {
      if (currentlyOnTestnet) {
        return;
      }

      const nextValue = !value;
      dispatch(setShowTestNetworksPreference(nextValue));
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TestNetworksDisplayed)
          .addCategory(MetaMetricsEventCategory.Network)
          .addProperties({
            value: nextValue,
          })
          .build(),
      );
    },
    [createEventBuilder, currentlyOnTestnet, dispatch, trackEvent],
  );

  const handleDefaultTestnetClick = useCallback(
    (network: ChainlistNetwork) => {
      if (!showTestNetworks) {
        dispatch(setShowTestNetworksPreference(true));
        trackEvent(
          createEventBuilder(MetaMetricsEventName.TestNetworksDisplayed)
            .addCategory(MetaMetricsEventCategory.Network)
            .addProperties({
              value: true,
            })
            .build(),
        );
      }

      onSelect(network, searchValue.trim() || undefined);
    },
    [
      createEventBuilder,
      dispatch,
      onSelect,
      searchValue,
      showTestNetworks,
      trackEvent,
    ],
  );

  const [prevSearchValue, setPrevSearchValue] = useState(searchValue);
  if (searchValue !== prevSearchValue) {
    setPrevSearchValue(searchValue);
    setVisibleNetworkCount(CHAINLIST_PAGE_SIZE);
  }

  const handleChainlistScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom > CHAINLIST_SCROLL_THRESHOLD_PX) {
        return;
      }

      setVisibleNetworkCount((currentCount) =>
        Math.min(currentCount + CHAINLIST_PAGE_SIZE, chainlistNetworks.length),
      );
    },
    [chainlistNetworks.length],
  );

  const isDropdown = layout === 'dropdown';
  const listboxId = useId();
  const suggestions = useMemo(() => {
    if (!isDropdown) {
      return [];
    }
    if (showNoSearchResults) {
      return onUseTypedName ? [{ type: 'typed-name' as const }] : [];
    }
    return [
      ...visibleChainlistNetworks.map((network) => ({
        type: 'network' as const,
        network,
      })),
      ...defaultTestnets.map((network) => ({
        type: 'testnet' as const,
        network,
      })),
    ];
  }, [
    defaultTestnets,
    isDropdown,
    onUseTypedName,
    showNoSearchResults,
    visibleChainlistNetworks,
  ]);
  const suggestionKey = suggestions
    .map((suggestion) =>
      suggestion.type === 'typed-name'
        ? 'typed-name'
        : `${suggestion.type}:${suggestion.network.chainId}`,
    )
    .join('|');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevSuggestionKey, setPrevSuggestionKey] = useState(suggestionKey);
  if (suggestionKey !== prevSuggestionKey) {
    setPrevSuggestionKey(suggestionKey);
    setActiveIndex(-1);
  }

  const selectSuggestion = useCallback(
    (index: number) => {
      const suggestion = suggestions[index];
      if (!suggestion) {
        return;
      }
      if (suggestion.type === 'typed-name') {
        onUseTypedName?.(searchValue.trim());
        return;
      }
      if (suggestion.type === 'testnet') {
        handleDefaultTestnetClick(suggestion.network);
        return;
      }
      onSelect(suggestion.network, searchValue.trim() || undefined);
    },
    [
      handleDefaultTestnetClick,
      onSelect,
      onUseTypedName,
      searchValue,
      suggestions,
    ],
  );

  useEffect(() => {
    if (!isDropdown || !comboboxInputId) {
      return undefined;
    }

    const input = document.getElementById(comboboxInputId);
    if (!(input instanceof HTMLInputElement)) {
      return undefined;
    }

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', listboxId);
    if (activeIndex >= 0) {
      input.setAttribute(
        'aria-activedescendant',
        `${listboxId}-option-${activeIndex}`,
      );
    } else {
      input.removeAttribute('aria-activedescendant');
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) =>
          suggestions.length === 0
            ? -1
            : Math.min(index + 1, suggestions.length - 1),
        );
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => {
          if (suggestions.length === 0) {
            return -1;
          }
          if (index < 0) {
            return suggestions.length - 1;
          }
          return Math.max(index - 1, -1);
        });
        return;
      }
      if (event.key === 'Enter') {
        if (activeIndex < 0) {
          return;
        }
        event.preventDefault();
        selectSuggestion(activeIndex);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss?.();
        return;
      }
      // Tab skips the suggestions, so close the list and let focus move on.
      if (event.key === 'Tab') {
        onDismiss?.();
      }
    };

    input.addEventListener('keydown', handleKeyDown);
    return () => {
      input.removeEventListener('keydown', handleKeyDown);
      input.removeAttribute('role');
      input.removeAttribute('aria-autocomplete');
      input.removeAttribute('aria-expanded');
      input.removeAttribute('aria-controls');
      input.removeAttribute('aria-activedescendant');
    };
  }, [
    activeIndex,
    comboboxInputId,
    isDropdown,
    listboxId,
    onDismiss,
    selectSuggestion,
    suggestions.length,
  ]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }
    document
      .getElementById(`${listboxId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listboxId]);

  const suggestionProps = (index: number) =>
    isDropdown
      ? {
          id: `${listboxId}-option-${index}`,
          role: 'option' as const,
          'aria-selected': activeIndex === index,
          tabIndex: -1 as const,
          onMouseEnter: () => setActiveIndex(index),
        }
      : undefined;

  const renderChainlistNetwork = (
    network: ChainlistNetwork,
    onClick: () => void,
    suggestionIndex?: number,
  ) => {
    const chainId = getHexChainId(network.chainId);
    const isExistingNetwork = existingNetworkChainIds.has(chainId);
    const displayName = existingNetworkNamesByChainId[chainId] ?? network.name;
    const networkImageUrl =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ];
    const isActive =
      suggestionIndex !== undefined && activeIndex === suggestionIndex;

    return (
      <button
        className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover active:bg-pressed${
          isActive ? ' bg-primary-muted' : ''
        }`}
        data-testid="networks-page-chainlist-network"
        key={`${network.chainId}-${network.name}`}
        type="button"
        {...(suggestionIndex === undefined
          ? undefined
          : suggestionProps(suggestionIndex))}
        onClick={onClick}
      >
        {networkImageUrl ? (
          <AvatarNetwork
            className="shrink-0 rounded-lg"
            name={displayName}
            size="md"
            src={networkImageUrl}
          />
        ) : (
          <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium uppercase text-text-default">
            {displayName.charAt(0)}
          </Box>
        )}
        <Box className="min-w-0 flex-1">
          <Box className="flex min-w-0 items-center gap-2">
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              className="truncate"
            >
              {displayName}
            </Text>
            {isExistingNetwork ? (
              <Box
                className="shrink-0 rounded bg-muted px-2 py-0.5"
                data-testid="networks-page-chainlist-added-pill"
              >
                <Text
                  variant={TextVariant.BodySm}
                  className="text-text-alternative"
                >
                  {t('added')}
                </Text>
              </Box>
            ) : null}
          </Box>
          <Text
            variant={TextVariant.BodyMd}
            className="truncate text-text-alternative"
          >
            {t('chainlistNetworkDetails', [
              network.nativeCurrency.symbol,
              String(network.chainId),
            ])}
          </Text>
        </Box>
      </button>
    );
  };

  const pickerClassName = isDropdown
    ? 'flex w-full flex-col overflow-y-auto bg-background-default'
    : 'flex min-h-0 flex-1 flex-col overflow-hidden bg-background-default';
  const pickerStyle =
    isDropdown && maxHeight !== undefined ? { maxHeight } : undefined;
  const picker = (
    <>
      {showSearchField ? (
        <Box className="px-4 pb-4">
          <TextFieldSearch
            className="w-full"
            clearButtonOnClick={() => setInternalSearchValue('')}
            data-testid="networks-page-chainlist-search"
            onChange={(event) => setInternalSearchValue(event.target.value)}
            placeholder={t('searchNetworkNameOrChainId')}
            value={searchValue}
          />
        </Box>
      ) : null}
      <Box
        className={isDropdown ? undefined : 'min-h-0 flex-1 overflow-y-auto'}
        data-testid="networks-page-chainlist-network-list"
        id={isDropdown ? listboxId : undefined}
        onScroll={isDropdown ? undefined : handleChainlistScroll}
        role={isDropdown ? 'listbox' : undefined}
      >
        {isDropdown && showNoSearchResults ? (
          <Box data-testid="networks-page-chainlist-no-matches">
            <Text
              variant={TextVariant.BodyMd}
              textAlign={TextAlign.Left}
              className="block w-full px-4 py-4 text-text-alternative"
            >
              {t('chainlistNoMatches')}
            </Text>
            {onUseTypedName ? (
              <button
                className={`flex w-full flex-col border-t border-border-muted px-4 py-3 text-left hover:bg-hover${
                  isDropdown && activeIndex === 0 ? ' bg-primary-muted' : ''
                }`}
                data-testid="networks-page-chainlist-use-typed-name"
                type="button"
                {...suggestionProps(0)}
                onClick={() => onUseTypedName(searchValue.trim())}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.InfoDefault}
                >
                  {t('chainlistUseTypedNetworkName', [searchValue.trim()])}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  className="text-text-alternative"
                >
                  {t('chainlistEnterNetworkDetailsManually')}
                </Text>
              </button>
            ) : null}
          </Box>
        ) : (
          <>
            <Box className={showSearchField ? 'px-4 pb-2' : 'px-4 py-2'}>
              <ChainlistSourceBanner
                description={(learnMore) =>
                  t('chainlistNetworkDataSourceBanner', [learnMore])
                }
                learnMoreTabIndex={isDropdown ? -1 : undefined}
                testId="networks-page-chainlist-source-banner"
              />
            </Box>
            {showNoSearchResults ? (
              <NoSearchResult dataTestId="networks-page-chainlist-no-results" />
            ) : null}
            {visibleChainlistNetworks.map((network, index) =>
              renderChainlistNetwork(
                network,
                () => onSelect(network, searchValue.trim() || undefined),
                isDropdown ? index : undefined,
              ),
            )}
            {defaultTestnets.length > 0 && !isDropdown ? (
              <Box
                className="flex items-center justify-between px-4 py-3"
                data-testid="networks-page-chainlist-default-testnets"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  className="text-text-alternative"
                >
                  {t('showTestnetNetworks')}
                </Text>
                <ToggleButton
                  dataTestId="networks-page-chainlist-show-test-networks"
                  disabled={currentlyOnTestnet}
                  onToggle={handleToggleTestNetworks}
                  value={showTestNetworks}
                />
              </Box>
            ) : null}
            {defaultTestnets.map((network, index) =>
              renderChainlistNetwork(
                network,
                () => handleDefaultTestnetClick(network),
                isDropdown
                  ? visibleChainlistNetworks.length + index
                  : undefined,
              ),
            )}
          </>
        )}
      </Box>
    </>
  );

  if (isDropdown) {
    return (
      <Box
        className={pickerClassName}
        onScroll={handleChainlistScroll}
        style={pickerStyle}
      >
        {picker}
      </Box>
    );
  }

  return <Box className={pickerClassName}>{picker}</Box>;
};
