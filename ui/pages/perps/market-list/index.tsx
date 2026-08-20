import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  TextColor,
  ButtonBase,
} from '@metamask/design-system-react';
import {
  getMarketTypeFilter,
  type PerpsMarketData,
} from '@metamask/perps-controller';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  usePerpsLiveAccount,
  usePerpsLiveMarketListData,
} from '../../../hooks/perps/stream';
import {
  filterMarketsByQuery,
  isHip3Market,
  isCryptoMarket,
} from '../../../components/app/perps/utils';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsPerpsExperienceAvailable,
  getHip3AllowedSourcesSet,
} from '../../../selectors/perps/feature-flags';
import {
  sortMarkets,
  type SortField,
  type SortDirection,
} from '../utils/sortMarkets';
import {
  normalizeMarketFilter,
  type MarketFilter,
} from '../../../../shared/constants/perps';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { usePerpsEventTracking } from '../../../hooks/perps';
import { usePerpsAttribution } from '../../../hooks/perps/usePerpsAttribution';
import { getTradeableBalance } from '../../../hooks/perps/getTradeableBalance';
import { MarketRow } from '../../../components/app/perps/market-row';
import { MarketRowSkeleton } from './components/market-row-skeleton';
import { SortDropdown } from './components/sort-dropdown';
import { SearchInput } from './components/search-input';
import { FilterSelect } from './components/filter-select';

/**
 * Settle window before a typed query counts as a real search, matching mobile
 * so the two clients report comparable search funnels.
 */
const SEARCH_QUERY_DEBOUNCE_MS = 500;

/**
 * `mode` values reported on the market-search funnel events. Values match
 * mobile's inline literals in `PerpsMarketListView` so both clients report the
 * same vocabulary.
 */
const SEARCH_MODE = {
  DISCOVERY: 'discovery',
  INTENT: 'intent',
  BROWSE: 'browse',
} as const;

/** A short ticker-like token ("btc", "hype2") reads as a targeted lookup. */
const TICKER_LIKE_QUERY = /^[a-z0-9]{1,6}$/u;

/**
 * Classify a search for the funnel `mode` property: chips/category narrow the
 * browse context → discovery; a short ticker-like token → intent; anything else
 * → browse.
 *
 * @param activeChips - Chips currently narrowing the list (category filter).
 * @param normalizedQuery - The lowercased, trimmed search query.
 * @returns The reported search mode.
 */
const deriveSearchMode = (
  activeChips: string[],
  normalizedQuery: string,
): (typeof SEARCH_MODE)[keyof typeof SEARCH_MODE] => {
  if (activeChips.length) {
    return SEARCH_MODE.DISCOVERY;
  }
  return TICKER_LIKE_QUERY.test(normalizedQuery)
    ? SEARCH_MODE.INTENT
    : SEARCH_MODE.BROWSE;
};

/**
 * Check if a market is an uncategorized HIP-3 market (no market type mapping).
 * These are HIP-3 assets that haven't been classified by the controller.
 *
 * @param market - The market data
 * @param allowedHip3Sources - Set of allowed HIP-3 market sources
 * @returns True if the market is HIP-3 but has no category
 */
const isUncategorizedHip3Market = (
  market: PerpsMarketData,
  allowedHip3Sources: Set<string>,
): boolean => {
  return (
    isHip3Market(market, allowedHip3Sources) &&
    getMarketTypeFilter(market) === 'new'
  );
};

/**
 * Filter markets by market type
 *
 * Crypto markets have no marketSource (main DEX).
 * Stock / commodity / forex markets are identified by the controller's v8
 * category helper —
 * intentionally not gated on the allowlist so categories work even when the
 * remote feature flag has not yet loaded (the controller's own fallback already
 * limits which HIP-3 markets reach the UI).
 * "New" category shows HIP-3 assets from allowed sources that haven't been categorized yet.
 *
 * @param markets - Array of markets to filter
 * @param filter - Market type filter
 * @param allowedHip3Sources - Set of allowed HIP-3 market sources (used for "new" tab only)
 * @returns Filtered array of markets
 */
const filterByType = (
  markets: PerpsMarketData[],
  filter: MarketFilter,
  allowedHip3Sources: Set<string>,
): PerpsMarketData[] => {
  switch (filter) {
    case 'all': {
      return markets;
    }
    case 'crypto': {
      return markets.filter(isCryptoMarket);
    }
    case 'new': {
      return markets.filter((m) =>
        isUncategorizedHip3Market(m, allowedHip3Sources),
      );
    }
    default: {
      // Any controller market category (stock, pre-ipo, index, etf, commodity,
      // forex, …) is matched generically so a new category works without a new
      // case here.
      return markets.filter((m) => getMarketTypeFilter(m) === filter);
    }
  }
};

/**
 * MarketListView displays a searchable, sortable list of markets
 */
export const MarketListView = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const allowedHip3Sources = useSelector(getHip3AllowedSourcesSet);
  const { track } = usePerpsEventTracking();
  const { setFlowAttribution } = usePerpsAttribution();

  // Use stream hooks for real-time market data
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketListData();
  const { account } = usePerpsLiveAccount();

  // Read initial filter from URL params (set by deeplink)
  const initialFilter = useMemo<MarketFilter>(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      // normalizeMarketFilter resolves legacy aliases (e.g. `stocks`) and returns
      // null for unknown values, so no extra validation is needed here.
      const normalizedFilter = normalizeMarketFilter(filterParam);
      if (normalizedFilter) {
        return normalizedFilter;
      }
    }
    return 'all';
  }, [searchParams]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedFilter, setSelectedFilter] =
    useState<MarketFilter>(initialFilter);

  // Use stream loading state
  const isLoading = marketsLoading;

  const hasPerpBalance = Boolean(
    account && Number.parseFloat(getTradeableBalance(account)) > 0,
  );
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: !isLoading && account !== null,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.MARKET_LIST,
      [PERPS_EVENT_PROPERTY.SOURCE]:
        PERPS_EVENT_VALUE.SOURCE.WALLET_HOME_PERPS_TAB,
      [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: hasPerpBalance,
      [PERPS_EVENT_PROPERTY.MARKET_CATEGORY_FILTER]: selectedFilter,
    },
  });

  // Check if there are any uncategorized HIP-3 markets (for showing "New" filter)
  const hasUncategorizedMarkets = useMemo(() => {
    return allMarkets.some((m) =>
      isUncategorizedHip3Market(m, allowedHip3Sources),
    );
  }, [allMarkets, allowedHip3Sources]);

  // Filter and sort markets
  // When searching, bypass filters and search ALL markets (like mobile)
  // When not searching, apply filters
  const displayedMarkets = useMemo(() => {
    let markets: PerpsMarketData[];

    if (searchQuery.trim()) {
      // Searching: search across ALL markets, ignore filters
      markets = filterMarketsByQuery(allMarkets, searchQuery);
    } else {
      // Not searching: apply filters
      markets = filterByType(allMarkets, selectedFilter, allowedHip3Sources);
    }

    markets = sortMarkets({
      markets,
      sortBy: sortField,
      direction: sortDirection,
    });
    return markets;
  }, [
    allMarkets,
    selectedFilter,
    allowedHip3Sources,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  // --- Market search funnel (query -> result tapped | abandoned) ------------
  // Refs, not state: these only feed analytics and must never trigger a render.
  const trackRef = useRef(track);
  trackRef.current = track;
  // Latest settled result set, read by the tap handler for rank/count.
  const displayedMarketsRef = useRef(displayedMarkets);
  displayedMarketsRef.current = displayedMarkets;
  // Last query actually emitted, so abandonment reports what was measured.
  const emittedQueryRef = useRef('');
  const emittedResultsCountRef = useRef<number | undefined>(undefined);
  const searchStartedAtRef = useRef<number | null>(null);
  const queryCountRef = useRef(0);
  const resultTappedRef = useRef(false);
  // Query typed but not yet emitted. Flushed on unmount so a mid-debounce exit
  // is never silently lost (mirrors mobile's `pendingSearchQueryRef`).
  const pendingQueryRef = useRef<string | null>(null);
  // Result count as of the render that last had this pending query on screen.
  const pendingResultCountRef = useRef<number | undefined>(undefined);
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  // What is in the box right now, so a tap can be attributed to a search that
  // is still inside the debounce window.
  const trimmedQueryRef = useRef('');
  trimmedQueryRef.current = searchQuery.trim();

  // Chips narrowing the browse context. The Extension exposes only the category
  // filter; mobile also counts its watchlist chip.
  const activeChips = useMemo(
    () => (selectedFilter === 'all' ? [] : [selectedFilter]),
    [selectedFilter],
  );
  const activeChipsRef = useRef(activeChips);
  activeChipsRef.current = activeChips;

  /**
   * Emit PERPS_SEARCH_QUERY (and the matching screen view once counts are
   * known). `resultsSettled` is false when flushing mid-load, in which case the
   * count-dependent props are omitted rather than reported as a mid-load zero.
   */
  const emitSearchQuery = useCallback(
    (
      normalizedQuery: string,
      resultsSettled: boolean,
      resultCountOverride?: number,
    ) => {
      const resultCount =
        resultCountOverride ?? displayedMarketsRef.current.length;
      const hasResults = resultCount > 0;
      const chips = activeChipsRef.current;

      emittedQueryRef.current = normalizedQuery;
      emittedResultsCountRef.current = resultsSettled ? resultCount : undefined;
      queryCountRef.current += 1;
      resultTappedRef.current = false;

      trackRef.current(MetaMetricsEventName.PerpsSearchQuery, {
        [PERPS_EVENT_PROPERTY.SEARCH_QUERY]: normalizedQuery,
        [PERPS_EVENT_PROPERTY.QUERY_TEXT]: normalizedQuery,
        [PERPS_EVENT_PROPERTY.QUERY_LENGTH]: normalizedQuery.length,
        ...(resultsSettled
          ? {
              [PERPS_EVENT_PROPERTY.RESULTS_COUNT]: resultCount,
              [PERPS_EVENT_PROPERTY.RESULT_COUNT]: resultCount,
              [PERPS_EVENT_PROPERTY.HAS_RESULTS]: hasResults,
            }
          : {}),
        [PERPS_EVENT_PROPERTY.MODE]: deriveSearchMode(chips, normalizedQuery),
        [PERPS_EVENT_PROPERTY.ACTIVE_CHIPS]: chips,
        [PERPS_EVENT_PROPERTY.SOURCE]:
          PERPS_EVENT_VALUE.SOURCE.PERP_MARKET_SEARCH,
      });

      // A results/no-results screen view is only meaningful once the counts are
      // known; while loading no such screen has actually been shown yet.
      if (resultsSettled) {
        trackRef.current(MetaMetricsEventName.PerpsScreenViewed, {
          [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: hasResults
            ? PERPS_EVENT_VALUE.SCREEN_TYPE.SEARCH_RESULTS_SHOWN
            : PERPS_EVENT_VALUE.SCREEN_TYPE.SEARCH_NO_RESULTS,
          [PERPS_EVENT_PROPERTY.SEARCH_QUERY]: normalizedQuery,
          [PERPS_EVENT_PROPERTY.RESULT_COUNT]: resultCount,
        });
      }
    },
    [],
  );

  const flushPendingSearchQuery = useCallback(() => {
    if (!pendingQueryRef.current) {
      return;
    }
    emitSearchQuery(
      pendingQueryRef.current,
      !isLoadingRef.current,
      pendingResultCountRef.current,
    );
    pendingQueryRef.current = null;
    pendingResultCountRef.current = undefined;
  }, [emitSearchQuery]);

  /**
   * Clear the whole search session so the next one never inherits a prior
   * session's query, count or start time (mobile's `resetSearchSession`).
   */
  const resetSearchSession = useCallback(() => {
    pendingQueryRef.current = null;
    pendingResultCountRef.current = undefined;
    emittedQueryRef.current = '';
    emittedResultsCountRef.current = undefined;
    searchStartedAtRef.current = null;
    queryCountRef.current = 0;
  }, []);

  const emitSearchAbandoned = useCallback(() => {
    if (!emittedQueryRef.current || resultTappedRef.current) {
      return;
    }
    trackRef.current(MetaMetricsEventName.PerpsSearchAbandoned, {
      [PERPS_EVENT_PROPERTY.SEARCH_QUERY]: emittedQueryRef.current,
      ...(emittedResultsCountRef.current === undefined
        ? {}
        : {
            [PERPS_EVENT_PROPERTY.RESULTS_COUNT]:
              emittedResultsCountRef.current,
          }),
      [PERPS_EVENT_PROPERTY.QUERY_COUNT]: queryCountRef.current,
      ...(searchStartedAtRef.current === null
        ? {}
        : {
            [PERPS_EVENT_PROPERTY.TIME_IN_SEARCH_MS]:
              Date.now() - searchStartedAtRef.current,
          }),
    });
    emittedQueryRef.current = '';
    emittedResultsCountRef.current = undefined;
    searchStartedAtRef.current = null;
    queryCountRef.current = 0;
  }, []);

  // Debounced PERPS_SEARCH_QUERY + the matching results/no-results screen view.
  // Waits for markets to settle so the reported count is never a mid-load zero,
  // and re-runs on count changes so the emitted count matches what is rendered.
  const trimmedQuery = searchQuery.trim();
  useEffect(() => {
    if (!trimmedQuery) {
      // Emptying the box (backspace or the clear affordance) ends the session
      // exactly like leaving the page: flush anything still inside the debounce
      // window so a typed-then-cleared query is measured rather than dropped,
      // report the unresolved search, then wipe the session so the next one
      // starts clean. The flush matches the fast-tap and unmount paths — all
      // three would otherwise lose the whole funnel for a sub-500ms search.
      flushPendingSearchQuery();
      emitSearchAbandoned();
      resetSearchSession();
      return undefined;
    }
    // The clock starts at the first keystroke, not at the first emitted query,
    // so time_in_search_ms / time_to_tap_ms cover the whole search session and
    // stay comparable with mobile rather than running a debounce shorter.
    if (searchStartedAtRef.current === null) {
      searchStartedAtRef.current = Date.now();
    }
    const normalizedQuery = trimmedQuery.toLowerCase();
    if (emittedQueryRef.current === normalizedQuery) {
      pendingQueryRef.current = null;
      return undefined;
    }
    pendingQueryRef.current = normalizedQuery;
    // Snapshot the count for THIS query while it is still the rendered one.
    // Clearing the box re-renders with the unfiltered list before the flush
    // runs, so reading the live ref at flush time would report the full-list
    // count (and `has_results: true`) for a query that matched nothing.
    pendingResultCountRef.current = isLoading
      ? undefined
      : displayedMarkets.length;
    // Wait for the markets to settle so the reported count is never a mid-load
    // zero. The effect re-runs when loading completes or the count changes.
    if (isLoading) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      emitSearchQuery(normalizedQuery, true);
      pendingQueryRef.current = null;
    }, SEARCH_QUERY_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [
    trimmedQuery,
    isLoading,
    displayedMarkets.length,
    emitSearchQuery,
    flushPendingSearchQuery,
    emitSearchAbandoned,
    resetSearchSession,
  ]);

  // Close the funnel on both ways out of the page: React teardown (in-app
  // navigation) and `pagehide` (the extension popup being dismissed, which hides
  // the document without unmounting React, so teardown never runs). Same
  // lifecycle pair `usePerpsAbandonOrderTracking` handles. Both flush a query
  // still inside the debounce window before reporting the abandonment, and
  // `emitSearchAbandoned` is idempotent — it clears `emittedQueryRef`, so a
  // pagehide followed by teardown reports once.
  useEffect(() => {
    const closeSearchSession = () => {
      flushPendingSearchQuery();
      emitSearchAbandoned();
    };
    window.addEventListener('pagehide', closeSearchSession);
    return () => {
      window.removeEventListener('pagehide', closeSearchSession);
      closeSearchSession();
    };
  }, [flushPendingSearchQuery, emitSearchAbandoned]);

  // Handlers
  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    // Emptying the box is the single abandonment path: the debounce effect's
    // empty branch reports and resets the session, so clearing, backspacing to
    // empty and Escape all behave identically.
    setSearchQuery('');
  }, []);

  const handleSortChange = useCallback(
    (field: SortField, direction: SortDirection) => {
      // Sort applied — field and/or direction changed.
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.SORT_APPLIED,
        [PERPS_EVENT_PROPERTY.SORT_FIELD]: field,
        [PERPS_EVENT_PROPERTY.SORT_DIRECTION]: direction,
      });
      setSortField(field);
      setSortDirection(direction);
    },
    [track],
  );

  const handleFilterChange = useCallback(
    (filter: MarketFilter) => {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
        [PERPS_EVENT_PROPERTY.TAB_NAME]: filter,
        [PERPS_EVENT_PROPERTY.BUTTON_TYPE]: filter,
        [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
          PERPS_EVENT_VALUE.BUTTON_LOCATION.MARKET_LIST,
      });
      // Filter applied — market category changed.
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.FILTER_APPLIED,
        [PERPS_EVENT_PROPERTY.FILTER_CATEGORY]: filter,
      });
      setSelectedFilter(filter);
    },
    [track],
  );

  const handleMarketSelect = useCallback(
    (market: PerpsMarketData) => {
      const tappedQuery = trimmedQueryRef.current.toLowerCase();
      // A market reached through the search box was discovered by search, not by
      // browsing the list. The query funnel already reports
      // `perp_market_search` as its source, so recording market-list here would
      // strip search attribution off every controller-emitted trade, close and
      // cancel that follows.
      setFlowAttribution({
        discoverySource: tappedQuery
          ? PERPS_EVENT_VALUE.SOURCE.PERP_MARKET_SEARCH
          : PERPS_EVENT_VALUE.SOURCE.MARKET_LIST,
        entryPoint: PERPS_EVENT_VALUE.SOURCE.MARKET_LIST,
      });
      // A tap on a search result closes the search funnel: report the rank the
      // user picked, and suppress the abandonment this navigation would emit.
      // Gated on what is in the box (not on what has been emitted) so a tap
      // inside the 500 ms debounce still counts; the pending query is flushed
      // first so the stream is always query -> tap, never tap -> query. The
      // flush re-arms `resultTappedRef`, so it is set after it, not before.
      if (tappedQuery) {
        const resultRank =
          displayedMarketsRef.current.findIndex(
            (m) => m.symbol === market.symbol,
          ) + 1;
        flushPendingSearchQuery();
        resultTappedRef.current = true;
        track(MetaMetricsEventName.PerpsSearchResultTapped, {
          [PERPS_EVENT_PROPERTY.SEARCH_QUERY]: tappedQuery,
          [PERPS_EVENT_PROPERTY.RESULTS_COUNT]:
            displayedMarketsRef.current.length,
          ...(resultRank > 0
            ? { [PERPS_EVENT_PROPERTY.RESULT_RANK]: resultRank }
            : {}),
          ...(searchStartedAtRef.current === null
            ? {}
            : {
                [PERPS_EVENT_PROPERTY.TIME_TO_TAP_MS]:
                  Date.now() - searchStartedAtRef.current,
              }),
          [PERPS_EVENT_PROPERTY.ASSET]: market.symbol,
        });
      }
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
        [PERPS_EVENT_PROPERTY.ASSET]: market.symbol,
      });
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
    },
    [navigate, setFlowAttribution, track, flushPendingSearchQuery],
  );

  const handleSearchClick = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.SEARCH_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.MARKET_LIST,
    });
  }, [track]);

  // Guard: redirect if perps feature is disabled
  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid="parent-selector-perps-market-list"
    >
      {/* Header */}
      <Box
        className="border-b border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
      >
        <ButtonBase
          onClick={handleBack}
          className="rounded-full p-1 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
          data-testid="back-button"
          aria-label={t('back')}
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconDefault}
          />
        </ButtonBase>
        <Text fontWeight={FontWeight.Medium}>{t('perpsMarkets')}</Text>
      </Box>

      {/* Search Row */}
      <Box
        className="border-b border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
      >
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          onInputClick={handleSearchClick}
          autoFocus
        />
      </Box>

      {/* Filter and Sort Row - Hidden when searching */}
      {!searchQuery.trim() && (
        <Box
          className="border-b border-border-muted px-4 py-3 flex-wrap"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Start}
          gap={3}
          data-testid="market-list-filter-sort-row"
        >
          <FilterSelect
            value={selectedFilter}
            onChange={handleFilterChange}
            showNewFilter={hasUncategorizedMarkets}
          />
          <SortDropdown
            selectedField={sortField}
            direction={sortDirection}
            onChange={handleSortChange}
          />
        </Box>
      )}

      {/* Market List */}
      <Box
        className="flex-1 overflow-y-auto"
        flexDirection={BoxFlexDirection.Column}
      >
        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => (
            <MarketRowSkeleton key={`skeleton-${index}`} />
          ))}

        {/* Market rows */}
        {!isLoading &&
          displayedMarkets.length > 0 &&
          displayedMarkets.map((market) => (
            <MarketRow
              key={market.symbol}
              market={market}
              displayMetric={sortField}
              onPress={handleMarketSelect}
            />
          ))}

        {/* Empty state */}
        {!isLoading && displayedMarkets.length === 0 && (
          <Box
            className="px-4 py-8"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
            data-testid="perps-market-list-no-results"
          >
            <Icon
              name={IconName.Search}
              size={IconSize.Lg}
              color={IconColor.IconMuted}
            />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsNoMarketsFound')}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MarketListView;
