import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  AvatarTokenSize,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonBase,
} from '@metamask/design-system-react';
import { brandColor } from '@metamask/design-tokens';
import type { Position, PriceUpdate } from '@metamask/perps-controller';
import {
  formatFundingRate,
  formatPerpsFiat,
  formatPnl,
  formatPositionSize,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../shared/lib/perps-formatters';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import { PERPS_CONSTANTS } from '../../components/app/perps/constants';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useTheme } from '../../hooks/useTheme';
import {
  DEFAULT_ROUTE,
  PERPS_ORDER_ENTRY_ROUTE,
  PERPS_ACTIVITY_ROUTE,
} from '../../helpers/constants/routes';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveAccount,
  usePerpsLiveMarketData,
  usePerpsLiveCandles,
} from '../../hooks/perps/stream';
import {
  usePerpsEligibility,
  usePerpsMarketFills,
  usePerpsEventTracking,
  usePerpsMarketInfo,
} from '../../hooks/perps';
import { getPerpsStreamManager } from '../../providers/perps';
import { submitRequestToBackground } from '../../store/background-connection';
import { usePerpsMeasurement } from '../../hooks/perps/usePerpsMeasurement';
import { OrderCard } from '../../components/app/perps/order-card';
import { TransactionCard } from '../../components/app/perps/transaction-card';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import {
  PerpsCandlestickChart,
  PerpsCandlestickChartRef,
} from '../../components/app/perps/perps-candlestick-chart';
import type { ChartPriceLine } from '../../components/app/perps/perps-candlestick-chart';
import { PerpsCandlePeriodSelector } from '../../components/app/perps/perps-candle-period-selector';
import {
  CandlePeriod,
  TimeDuration,
  ZOOM_CONFIG,
} from '../../components/app/perps/constants/chartConfig';
import {
  getDisplayName,
  safeDecodeURIComponent,
  getChangeColor,
  formatSignedChangePercent,
} from '../../components/app/perps/utils';
import {
  parsePerpsDisplayPrice,
  formatPerpsFiatMinimal,
  formatPerpsFiatUniversal,
} from '../../components/app/perps/utils/formatPerpsDisplayPrice';
import { transformFillsToTransactions } from '../../components/app/perps/utils/transactionTransforms';
import { normalizeMarketDetailsOrders } from '../../components/app/perps/utils/orderUtils';
import { PerpsDetailPageSkeleton } from '../../components/app/perps/perps-skeletons';
import { Skeleton } from '../../components/component-library/skeleton';
import { Popover, PopoverPosition } from '../../components/component-library';
import { useFormatters } from '../../hooks/useFormatters';
import { EditMarginModal } from '../../components/app/perps/edit-margin';
import { ReversePositionModal } from '../../components/app/perps/reverse-position';
import { UpdateTPSLModal } from '../../components/app/perps/update-tpsl';
import { ClosePositionModal } from '../../components/app/perps/close-position';
import { CancelOrderModal } from '../../components/app/perps/cancel-order';
import { PerpsGeoBlockModal } from '../../components/app/perps/perps-geo-block-modal';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import type { Order } from '../../components/app/perps/types';
import {
  PERPS_TOAST_KEYS,
  type PerpsToastKey,
  usePerpsToast,
} from '../../components/app/perps/perps-toast';
import Tooltip from '../../components/ui/tooltip';
import { BorderRadius } from '../../helpers/constants/design-system';
import type { MetaMaskReduxState } from '../../store/store';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import {
  type PerpsState,
  selectPerpsIsWatchlistMarket,
} from '../../selectors/perps-controller';
import { setTutorialModalOpen } from '../../ducks/perps';
import { PerpsTutorialModal } from '../../components/app/perps/perps-tutorial-modal';

/**
 * Calculate the funding countdown string (time until next UTC hour).
 * Funding on HyperLiquid is paid every hour on the hour (UTC).
 *
 * @returns Formatted countdown string, e.g. "00:23:45"
 */
function calculateFundingCountdown(): string {
  const now = new Date();
  let minutesRemaining = 59 - now.getUTCMinutes();
  let secondsRemaining = 60 - now.getUTCSeconds();

  // Handle rollover: if seconds hit 60, carry to minutes
  if (secondsRemaining === 60) {
    secondsRemaining = 0;
    minutesRemaining += 1;
  }

  // Handle rollover: if minutes hit 60, display as 01:00:00
  if (minutesRemaining === 60) {
    return '01:00:00';
  }

  const hh = '00';
  const mm = String(minutesRemaining).padStart(2, '0');
  const ss = String(secondsRemaining).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Hook that returns a live funding countdown string, updated every second.
 *
 * @returns Formatted countdown string, e.g. "00:23:45"
 */
function useFundingCountdown(): string {
  const [countdown, setCountdown] = useState(calculateFundingCountdown);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateFundingCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}

type PopoverMenuItemProps = {
  icon: IconName;
  label: string;
  description: string;
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
};

const PopoverMenuItem: React.FC<PopoverMenuItemProps> = ({
  icon,
  label,
  description,
  onClick,
  className = '',
  'data-testid': testId,
}) => (
  <Box
    className={`w-full text-left px-4 py-4 bg-transparent hover:bg-hover active:bg-pressed flex items-start gap-3 cursor-pointer ${className}`}
    onClick={onClick}
    data-testid={testId}
  >
    <Icon
      name={icon}
      size={IconSize.Sm}
      color={IconColor.IconDefault}
      className="shrink-0 mt-0.5"
    />
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={0}
      className="min-w-0 flex-1"
    >
      <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
        {label}
      </Text>
      <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
        {description}
      </Text>
    </Box>
  </Box>
);

const PERPS_TOAST_KEY_SET: Set<string> = new Set(
  Object.values(PERPS_TOAST_KEYS),
);

const isPerpsToastKey = (value: unknown): value is PerpsToastKey => {
  return typeof value === 'string' && PERPS_TOAST_KEY_SET.has(value);
};

type ParsedPerpsToastRouteState = {
  perpsToastDescription?: string;
  perpsToastKey: PerpsToastKey;
  remainingState?: Record<string, unknown>;
};

const parsePerpsToastRouteState = (
  state: unknown,
): ParsedPerpsToastRouteState | null => {
  if (!state || typeof state !== 'object') {
    return null;
  }

  const routeState = state as Record<string, unknown>;
  if (!isPerpsToastKey(routeState.perpsToastKey)) {
    return null;
  }

  const { perpsToastKey, perpsToastDescription, ...remainingState } =
    routeState;

  const routeToastDescription =
    typeof perpsToastDescription === 'string' && perpsToastDescription
      ? perpsToastDescription
      : undefined;

  return {
    perpsToastKey,
    ...(routeToastDescription
      ? { perpsToastDescription: routeToastDescription }
      : {}),
    ...(Object.keys(remainingState).length > 0 ? { remainingState } : {}),
  };
};

/**
 * PerpsMarketDetailPage component
 * Displays detailed market information for a specific perps market
 * Accessible via /perps/market/:symbol route
 */
const PerpsMarketDetailPage: React.FC = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { symbol } = useParams<{ symbol: string }>();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { isEligible } = usePerpsEligibility();
  const { track } = usePerpsEventTracking();
  const {
    formatCurrencyWithMinThreshold,
    formatNumber,
    formatPercentWithMinThreshold,
  } = useFormatters();
  const fundingCountdown = useFundingCountdown();
  const { replacePerpsToastByKey } = usePerpsToast();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  useEffect(() => {
    const parsedRouteState = parsePerpsToastRouteState(location.state);
    if (!parsedRouteState) {
      return;
    }

    replacePerpsToastByKey({
      key: parsedRouteState.perpsToastKey,
      ...(parsedRouteState.perpsToastDescription
        ? { description: parsedRouteState.perpsToastDescription }
        : {}),
    });

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: parsedRouteState.remainingState ?? undefined,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    replacePerpsToastByKey,
  ]);

  // Use stream hooks for real-time data
  const { positions: allPositions } = usePerpsLivePositions();
  const orderFilledToastShownRef = useRef(false);

  useEffect(() => {
    if (orderFilledToastShownRef.current) {
      return;
    }

    const routeState = location.state as Record<string, unknown> | null;
    const pendingSymbol =
      typeof routeState?.pendingOrderSymbol === 'string'
        ? routeState.pendingOrderSymbol
        : null;

    if (!pendingSymbol) {
      return;
    }

    const hasPosition = allPositions.some((p) => p.symbol === pendingSymbol);
    if (hasPosition) {
      orderFilledToastShownRef.current = true;

      const filledDescription =
        typeof routeState?.pendingOrderFilledDescription === 'string'
          ? routeState.pendingOrderFilledDescription
          : undefined;

      replacePerpsToastByKey({
        key: PERPS_TOAST_KEYS.ORDER_FILLED,
        ...(filledDescription ? { description: filledDescription } : {}),
      });
    }
  }, [location.state, allPositions, replacePerpsToastByKey]);

  const { orders: allOrders } = usePerpsLiveOrders();
  const { account, isInitialLoading: isLoadingAccount } = usePerpsLiveAccount();
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();
  const { trigger: triggerDeposit, isLoading: isDepositLoading } =
    usePerpsDepositConfirmation();

  // Safely decode the symbol from URL
  const decodedSymbol = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    return safeDecodeURIComponent(symbol);
  }, [symbol]);

  const hasPerpBalance = Boolean(
    account && Number.parseFloat(account.availableBalance) > 0,
  );
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: !marketsLoading && Boolean(decodedSymbol) && account !== null,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.ASSET_DETAILS,
      ...(decodedSymbol && {
        [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol,
      }),
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.MARKET_LIST,
      [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: hasPerpBalance ? 'yes' : 'no',
    },
    resetKey: decodedSymbol,
  });

  const [showSizeInFiat, setShowSizeInFiat] = useState(false);

  // Subscribe to live price data for current symbol (provides oracle price, live funding, OI)
  // Uses background streaming via perpsActivatePriceStream + PerpsStreamManager
  const [livePrice, setLivePrice] = useState<PriceUpdate | undefined>(
    undefined,
  );
  useEffect(() => {
    if (!decodedSymbol || !selectedAddress) {
      setLivePrice(undefined);
      return undefined;
    }

    // Activate background price stream for this symbol
    submitRequestToBackground('perpsActivatePriceStream', [
      { symbols: [decodedSymbol], includeMarketData: true },
    ]).catch(() => {
      // Controller not ready yet, skip silently
    });

    // Subscribe to price updates from the stream manager
    const streamManager = getPerpsStreamManager();
    const unsubscribe = streamManager.prices.subscribe((priceUpdates) => {
      const update = priceUpdates.find((p) => p.symbol === decodedSymbol);
      if (update) {
        const ts = (update as { timestamp?: number }).timestamp;
        const mark = (update as { markPrice?: string }).markPrice;
        setLivePrice({
          symbol: update.symbol,
          price: update.price,
          timestamp: ts ?? Date.now(),
          percentChange24h: update.percentChange24h,
          markPrice: mark,
        });
      }
    });

    return () => {
      submitRequestToBackground('perpsDeactivatePriceStream', []);
      unsubscribe();
    };
  }, [decodedSymbol, selectedAddress]);

  // Find market data for the given symbol
  const market = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return allMarkets.find(
      (m) => m.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [decodedSymbol, allMarkets]);

  const marketInfo = usePerpsMarketInfo(decodedSymbol ?? '');

  // Find position for this market (if exists)
  const position = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return allPositions.find(
      (pos) => pos.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [decodedSymbol, allPositions]);
  const hasNoAvailableBalance =
    !position && !isLoadingAccount && !hasPerpBalance;

  // Ref to track current position - avoids stale data in callbacks
  // This follows mobile's pattern (currentPositionRef) to ensure we always
  // have the latest position data when callbacks execute after navigation/delays
  //
  // TODO: Future improvement - pass the live position from WebSocket to
  // updatePositionTPSL to avoid REST fallback. See mobile's architecture:
  // - If params.position is provided, use it (WebSocket-derived)
  // - Otherwise, controller falls back to REST fetch
  // This optimization should be implemented in @metamask/perps-controller
  // and applied to multiple operations (TPSL, closePosition, etc.)
  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Filter and sort open orders for this market, then normalize for display.
  // Normalization adds synthetic TP/SL rows for parent orders and filters out
  // full-position TP/SL (those stay on the position card / auto-close section).
  const orders = useMemo(() => {
    if (!decodedSymbol) {
      return [];
    }
    const marketOrders = allOrders
      .filter(
        (order) =>
          order.symbol.toLowerCase() === decodedSymbol.toLowerCase() &&
          order.status === 'open',
      )
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return normalizeMarketDetailsOrders({
      orders: marketOrders,
      existingPosition: position,
    });
  }, [decodedSymbol, allOrders, position]);

  // Candle period state and chart ref
  const [selectedPeriod, setSelectedPeriod] = useState<CandlePeriod>(
    CandlePeriod.FiveMinutes,
  );
  const chartRef = useRef<PerpsCandlestickChartRef>(null);

  // Live candle data from CandleStreamChannel
  const {
    candleData,
    isInitialLoading: isCandleLoading,
    error: candleError,
    fetchMoreHistory,
  } = usePerpsLiveCandles({
    symbol: decodedSymbol ?? '',
    interval: selectedPeriod,
    duration: TimeDuration.YearToDate,
    throttleMs: 1000,
  });

  // Fetch market-specific fills (WebSocket + REST) for Recent Activity
  const { fills: marketFills, isInitialLoading: fillsLoading } =
    usePerpsMarketFills({
      symbol: decodedSymbol ?? '',
      throttleMs: 0,
    });

  const recentActivityTransactions = useMemo(() => {
    const transactions = transformFillsToTransactions(marketFills);
    return transactions.slice(0, PERPS_CONSTANTS.RECENT_ACTIVITY_LIMIT);
  }, [marketFills]);

  usePerpsMeasurement(
    'PerpsMarketDetailLoaded',
    !marketsLoading && !isCandleLoading && !fillsLoading,
  );

  // OHLCV bar state: the candle currently hovered by crosshair (null = no hover)
  // const [hoveredCandle, setHoveredCandle] = useState<CandleStick | null>(null);

  const [isModifyMenuOpen, setIsModifyMenuOpen] = useState(false);
  const [isMarginMenuOpen, setIsMarginMenuOpen] = useState(false);
  const [marginModalMode, setMarginModalMode] = useState<
    'add' | 'remove' | null
  >(null);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isTPSLModalOpen, setIsTPSLModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<Order | null>(
    null,
  );
  const modifyMenuRef = useRef<HTMLDivElement>(null);
  const marginMenuRef = useRef<HTMLDivElement>(null);
  const isInWatchlist = useSelector((state: MetaMaskReduxState) =>
    selectPerpsIsWatchlistMarket(state as PerpsState, decodedSymbol ?? ''),
  );

  // Parse fallback price from market data (used before candle stream is ready)
  const marketPrice = useMemo(() => {
    if (!market) {
      return 0;
    }
    return parseFloat(market.price.replace(/[$,]/gu, ''));
  }, [market]);

  // Current price derived from the last candle's close price.
  // Updates on every live tick (~1000ms), keeping the price line in sync with the chart.
  // This is the single source of truth for price display on the detail page.
  const chartCurrentPrice = useMemo(() => {
    if (!candleData?.candles?.length) {
      return 0;
    }
    const lastCandle = candleData.candles.at(-1);
    return lastCandle?.close ? parseFloat(lastCandle.close) : 0;
  }, [candleData]);

  // Current price for calculations (orders, margin, slippage).
  // Prefers the live candle price, falls back to market data during initial load.
  const currentPrice = chartCurrentPrice > 0 ? chartCurrentPrice : marketPrice;

  // Formatted display price for the header — synced with the chart price line.
  // Falls back to market.price string during initial candle load.
  const displayPrice = useMemo(() => {
    if (chartCurrentPrice > 0) {
      return formatPerpsFiatUniversal(chartCurrentPrice);
    }
    const streamPrice = Number.parseFloat(livePrice?.price ?? '');
    if (Number.isFinite(streamPrice) && streamPrice > 0) {
      return formatPerpsFiatUniversal(streamPrice);
    }
    if (market?.price) {
      return formatPerpsFiatUniversal(market.price);
    }
    return '$0.00';
  }, [market?.price, livePrice?.price, chartCurrentPrice]);

  // 24h change prefers live stream updates when available, with market-data fallback.
  const displayChange = formatSignedChangePercent(
    livePrice?.percentChange24h ?? market?.change24hPercent ?? '',
  );

  // Build price lines for chart overlay (current price + TP, Entry, SL)
  // Current price line is always shown; TP/Entry/SL only when position exists.
  const chartPriceLines = useMemo((): ChartPriceLine[] => {
    const lines: ChartPriceLine[] = [];

    // Current price line — always shown, derived from last candle close
    if (chartCurrentPrice > 0) {
      lines.push({
        price: chartCurrentPrice,
        label: '',
        // Matches mobile `background.muted`: dark=#ffffff0a (~4%), light=#b4b4b528 (~16%)
        color: isDark ? '#ffffff0a' : '#b4b4b528',
        lineStyle: 2,
        lineWidth: 2,
      });
    }

    // Position-specific lines (only when user has an open position)
    if (position) {
      // Take Profit line — matches mobile `success.default`
      if (position.takeProfitPrice) {
        const tpPrice = parsePerpsDisplayPrice(position.takeProfitPrice);
        if (!isNaN(tpPrice) && tpPrice > 0) {
          lines.push({
            price: tpPrice,
            label: 'TP',
            color: isDark ? brandColor.lime100 : brandColor.lime500,
            lineStyle: 2,
          });
        }
      }

      // Entry price line — matches mobile `text.muted`
      if (position.entryPrice) {
        const entryPrice = parsePerpsDisplayPrice(position.entryPrice);
        if (!isNaN(entryPrice) && entryPrice > 0) {
          lines.push({
            price: entryPrice,
            label: 'Entry',
            color: isDark ? brandColor.grey600 : brandColor.grey200,
            lineStyle: 2,
          });
        }
      }

      // Stop Loss line — matches mobile `background.alternative`
      // Intentionally subtle: SL is a reference marker, not a danger indicator like Liq.
      if (position.stopLossPrice) {
        const slPrice = parsePerpsDisplayPrice(position.stopLossPrice);
        if (!isNaN(slPrice) && slPrice > 0) {
          lines.push({
            price: slPrice,
            label: 'SL',
            color: isDark ? brandColor.grey1000 : brandColor.grey050,
            lineStyle: 2,
          });
        }
      }

      // Liquidation price line — matches mobile `error.default`
      // Same as down candles so traders immediately recognise the danger level.
      if (position.liquidationPrice) {
        const liqPrice = parsePerpsDisplayPrice(position.liquidationPrice);
        if (!isNaN(liqPrice) && liqPrice > 0) {
          lines.push({
            price: liqPrice,
            label: 'Liq',
            color: isDark ? brandColor.red300 : brandColor.red500,
            lineStyle: 2,
          });
        }
      }
    }

    return lines;
  }, [position, chartCurrentPrice, isDark]);

  // Handle candle period change
  //
  // TODO: When integrating live data, this handler must trigger a NEW API call
  // for candle data at the selected interval. Key implementation notes:
  //
  // 1. RE-FETCH, DON'T AGGREGATE: Each interval change should call the candle
  // API with the new interval parameter (e.g., candleSnapshot({ interval: '1h' })).
  // The server returns pre-aggregated candles - do NOT fetch 1m candles and
  // aggregate client-side.
  //
  // 2. CACHE KEY PER INTERVAL: Use separate cache keys for each interval
  // (e.g., "BTC-1h", "BTC-15m") since they are different data sets.
  //
  // 3. DATA FLOW ON INTERVAL CHANGE:
  // User taps interval → Update selectedPeriod state
  // → Hook re-runs with new interval in dependency array
  // → New API call: candleSnapshot({ symbol, interval: newPeriod })
  // → Chart re-renders with new data
  // → Call applyZoom() to reset view
  //
  // 4. LIVE CANDLE UPDATES VIA WEBSOCKET:
  // Two-phase data loading:
  // - Phase 1: Fetch historical candles (includes partial "forming" candle at end)
  // - Phase 2: Subscribe to WebSocket for real-time updates
  //
  // WebSocket update logic (compare timestamps):
  // | Condition                          | Action                              |
  // |------------------------------------|-------------------------------------|
  // | lastCandle.time === newCandle.time | REPLACE last candle (still forming) |
  // | lastCandle.time !== newCandle.time | APPEND new candle (previous closed) |
  //
  // Example timeline:
  // Initial:   [c1, c2, c3, c4, c5(partial)] ← c5 is forming
  // WS update: [c1, c2, c3, c4, c5(updated)] ← REPLACE (same time)
  // WS update: [c1, c2, c3, c4, c5, c6(new)] ← APPEND (new time)
  //
  // Key: Always create NEW arrays for immutable updates to trigger React re-renders.
  //
  // 5. MOBILE REFERENCE: See usePerpsLiveCandles hook, CandleStreamChannel,
  // and HyperLiquidClientService.subscribeToCandles() in the mobile app.
  const handlePeriodChange = useCallback((period: CandlePeriod) => {
    setSelectedPeriod(period);
    // Apply default zoom when period changes
    if (chartRef.current) {
      chartRef.current.applyZoom(ZOOM_CONFIG.DEFAULT_CANDLES, true);
    }
  }, []);

  const handleBackClick = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const buildOrderEntryUrl = useCallback(
    (direction: 'long' | 'short', mode: 'new' | 'modify') => {
      if (!decodedSymbol) {
        return '#';
      }
      const params = new URLSearchParams({ direction, mode });
      return `${PERPS_ORDER_ENTRY_ROUTE}/${encodeURIComponent(decodedSymbol)}?${params.toString()}`;
    },
    [decodedSymbol],
  );

  const handleOpenOrder = useCallback(
    (direction: 'long' | 'short') => {
      if (!isEligible) {
        setIsGeoBlockModalOpen(true);
        return;
      }
      if (!decodedSymbol || isLoadingAccount) {
        return;
      }
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
        [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
          PERPS_EVENT_VALUE.BUTTON_CLICKED.TRADE,
        [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
          PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
        [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol,
        [PERPS_EVENT_PROPERTY.DIRECTION]: direction,
      });
      navigate(buildOrderEntryUrl(direction, 'new'));
    },
    [
      isEligible,
      decodedSymbol,
      isLoadingAccount,
      navigate,
      buildOrderEntryUrl,
      track,
    ],
  );

  const handleAddFunds = useCallback(() => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    if (!selectedAddress || isDepositLoading) {
      return;
    }

    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.DEPOSIT,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
      ...(decodedSymbol && { [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol }),
    });

    triggerDeposit();
  }, [
    decodedSymbol,
    isDepositLoading,
    isEligible,
    selectedAddress,
    track,
    triggerDeposit,
  ]);

  const handleClosePosition = useCallback(() => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    if (!position) {
      return;
    }
    setIsCloseModalOpen(true);
  }, [isEligible, position]);

  const handleOpenAddMarginModal = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.ADD_MARGIN,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
    });
    setIsModifyMenuOpen(false);
    setIsMarginMenuOpen(false);
    setMarginModalMode('add');
  }, [track]);

  const handleOpenDecreaseMarginModal = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.REMOVE_MARGIN,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
    });
    setIsModifyMenuOpen(false);
    setIsMarginMenuOpen(false);
    setMarginModalMode('remove');
  }, [track]);

  const handleOpenReverseModal = useCallback(() => {
    setIsModifyMenuOpen(false);
    setIsReverseModalOpen(true);
  }, []);

  const handleAddExposure = useCallback(() => {
    if (!position || !decodedSymbol) {
      return;
    }
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.INCREASE_EXPOSURE,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
    });
    setIsModifyMenuOpen(false);
    const direction = parseFloat(position.size) >= 0 ? 'long' : 'short';
    navigate(buildOrderEntryUrl(direction, 'modify'));
  }, [position, decodedSymbol, navigate, buildOrderEntryUrl, track]);

  const handleReduceExposure = useCallback(() => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    if (!position || !decodedSymbol) {
      return;
    }
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.REDUCE_EXPOSURE,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
    });
    setIsModifyMenuOpen(false);
    setIsCloseModalOpen(true);
  }, [isEligible, position, decodedSymbol, track]);

  const handleOpenMarginMenu = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.MARGIN,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
    });
    setIsModifyMenuOpen(false);
    setIsMarginMenuOpen((prev) => !prev);
  }, [track]);

  const handleCloseMarginModal = useCallback(() => {
    setMarginModalMode(null);
  }, []);

  const handleCloseReverseModal = useCallback(() => {
    setIsReverseModalOpen(false);
  }, []);

  const handleOpenTPSLModal = useCallback(() => {
    setIsTPSLModalOpen(true);
  }, []);

  const handleCloseTPSLModal = useCallback(() => {
    setIsTPSLModalOpen(false);
  }, []);

  const handleFavoriteClick = useCallback(() => {
    if (!decodedSymbol) {
      return;
    }
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.FAVORITE_TOGGLED,
      [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
    });
    submitRequestToBackground('perpsToggleWatchlistMarket', [
      decodedSymbol,
    ]).catch((e) => {
      console.warn('[Perps] Toggle watchlist failed:', e);
    });
  }, [decodedSymbol, track]);

  // Opens the cancel order modal for the selected order
  const handleOrderClick = useCallback((order: Order) => {
    setCancelOrderTarget(order);
  }, []);

  // Guard: redirect if perps feature is disabled
  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  // If no symbol provided or malformed URL encoding, redirect to home
  if (!symbol || !decodedSymbol) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  // Show loading state while market data is being fetched
  if (marketsLoading) {
    return <PerpsDetailPageSkeleton />;
  }

  // If market not found after loading, show error state
  if (!market) {
    return (
      <Box className="main-container asset__container">
        <Box paddingLeft={2} paddingBottom={4} paddingTop={4}>
          <Box
            data-testid="perps-market-detail-back-button"
            onClick={handleBackClick}
            aria-label={t('back')}
            className="p-2 cursor-pointer"
          >
            <Icon
              name={IconName.ArrowLeft}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          padding={4}
        >
          <Text variant={TextVariant.HeadingMd} color={TextColor.TextDefault}>
            {t('perpsMarketNotFound')}
          </Text>
          <Box paddingTop={2}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsMarketNotFoundDescription', [
                getDisplayName(safeDecodeURIComponent(symbol) ?? symbol),
              ])}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  const displayName = getDisplayName(market.symbol);

  // Render the chart area: skeleton during initial load, error state on failure,
  // or the live chart once data is available.
  const renderChartContent = () => {
    if (isCandleLoading && !candleData) {
      return (
        <Skeleton className="h-[250px] w-full" borderRadius={BorderRadius.LG} />
      );
    }

    if (candleError && !candleData) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="h-[250px] w-full rounded-lg bg-muted"
          gap={2}
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Lg}
            color={IconColor.IconAlternative}
          />
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsChartLoadError') ?? 'Failed to load chart data'}
          </Text>
        </Box>
      );
    }

    return (
      <PerpsCandlestickChart
        ref={chartRef}
        height={250}
        selectedPeriod={selectedPeriod}
        candleData={candleData}
        priceLines={chartPriceLines}
        onNeedMoreHistory={fetchMoreHistory}
        // onCrosshairMove={setHoveredCandle}
      />
    );
  };

  const renderRecentActivityContent = () => {
    if (fillsLoading && recentActivityTransactions.length === 0) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="overflow-hidden rounded-xl"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-none" />
          ))}
        </Box>
      );
    }

    if (recentActivityTransactions.length === 0) {
      return (
        <Box paddingBottom={4}>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsNoTransactions')}
          </Text>
        </Box>
      );
    }

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="overflow-hidden rounded-xl"
      >
        {recentActivityTransactions.map((transaction, index) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            variant="muted"
            showTopBorder={index > 0}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box
      className="main-container asset__container"
      data-testid="perps-market-detail-page"
    >
      {/* Header */}
      <Box
        className="sticky top-0 z-10 bg-background-default"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
        gap={2}
      >
        {/* Back Button */}
        <Box
          data-testid="perps-market-detail-back-button"
          onClick={handleBackClick}
          aria-label={t('back')}
          className="p-2 -ml-2 cursor-pointer"
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>

        {/* Token Logo */}
        <PerpsTokenLogo symbol={market.symbol} size={AvatarTokenSize.Md} />

        {/* Header Content: symbol-USD, price + change */}
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {displayName}-USD
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Baseline}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              data-testid="perps-market-detail-price"
            >
              {displayPrice}
            </Text>
            <Text
              variant={TextVariant.BodyXs}
              color={getChangeColor(displayChange)}
              data-testid="perps-market-detail-change"
            >
              {displayChange}
            </Text>
          </Box>
        </Box>

        <Box className="flex-1" />

        <Box
          data-testid="perps-market-detail-favorite-button"
          aria-label={
            isInWatchlist
              ? t('perpsRemoveFromFavorites')
              : t('perpsAddToFavorites')
          }
          className="p-2 cursor-pointer"
          onClick={handleFavoriteClick}
        >
          <Icon
            name={isInWatchlist ? IconName.StarFilled : IconName.Star}
            size={IconSize.Md}
            color={
              isInWatchlist ? IconColor.IconDefault : IconColor.IconAlternative
            }
          />
        </Box>
      </Box>

      {/* OHLCV Bar — commented out for now
      {hoveredCandle && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={1}
          data-testid="perps-ohlcv-bar"
        >
          {[
            { label: 'Open', value: hoveredCandle.open },
            { label: 'Close', value: hoveredCandle.close },
            { label: 'High', value: hoveredCandle.high },
            { label: 'Low', value: hoveredCandle.low },
          ].map(({ label, value }) => (
            <Box
              key={label}
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Start}
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {`$${formatNumber(parseFloat(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                {label}
              </Text>
            </Box>
          ))}
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.End}
          >
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
              {`$${formatNumber(parseFloat(hoveredCandle.volume) * parseFloat(hoveredCandle.close), { notation: 'compact', maximumFractionDigits: 2 })}`}
            </Text>
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              Volume
            </Text>
          </Box>
        </Box>
      )}
      */}

      {/* Candlestick Chart */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        data-testid="perps-market-detail-chart"
      >
        {renderChartContent()}
      </Box>

      {/* Candle Period Selector */}
      <PerpsCandlePeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {/* Detail View Content */}
      <>
        {/* Position Section */}
        {position && (
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <Box paddingBottom={2}>
              <Text
                variant={TextVariant.HeadingSm}
                fontWeight={FontWeight.Medium}
              >
                {t('perpsPosition')}
              </Text>
            </Box>

            {/* Position Details Cards */}
            <Box flexDirection={BoxFlexDirection.Column} gap={2} paddingTop={2}>
              {/* First Row: P&L and Return */}
              <Box flexDirection={BoxFlexDirection.Row} gap={2}>
                {/* P&L Card */}
                <Box className="flex-1 rounded-xl bg-muted px-4 py-3">
                  <Box paddingBottom={1}>
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsPnl')}
                    </Text>
                  </Box>
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={
                      parseFloat(position.unrealizedPnl) >= 0
                        ? TextColor.SuccessDefault
                        : TextColor.ErrorDefault
                    }
                  >
                    {formatPnl(position.unrealizedPnl)}
                  </Text>
                </Box>

                {/* Return Card */}
                <Box className="flex-1 rounded-xl bg-muted px-4 py-3">
                  <Box paddingBottom={1}>
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsReturn')}
                    </Text>
                  </Box>
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={
                      parseFloat(position.returnOnEquity) >= 0
                        ? TextColor.SuccessDefault
                        : TextColor.ErrorDefault
                    }
                  >
                    {/* Controller/mobile ROE is a ratio (e.g. 0.1579), same as what the formatter expects. */}
                    {formatPercentWithMinThreshold(
                      Number.parseFloat(position.returnOnEquity),
                    )}
                  </Text>
                </Box>
              </Box>

              {/* Second Row: Size and Margin */}
              <Box flexDirection={BoxFlexDirection.Row} gap={2}>
                {/* Size Card */}
                <Box
                  className="flex-1 cursor-pointer rounded-xl bg-muted px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed"
                  flexDirection={BoxFlexDirection.Column}
                  onClick={() => {
                    setShowSizeInFiat((prev) => !prev);
                  }}
                >
                  <Box paddingBottom={1}>
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsSize')}
                    </Text>
                  </Box>
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-position-size-value"
                  >
                    {showSizeInFiat && Boolean(position.entryPrice)
                      ? formatPerpsFiatUniversal(
                          Math.abs(parseFloat(position.size)) *
                            parsePerpsDisplayPrice(position.entryPrice),
                        )
                      : `${formatPositionSize(
                          Math.abs(parseFloat(position.size)),
                          marketInfo?.szDecimals,
                        )} ${getDisplayName(position.symbol)}`}
                  </Text>
                </Box>

                {/* Margin Card - click to open Add/Remove margin popover */}
                <Box
                  ref={marginMenuRef}
                  className="relative flex-1 rounded-xl bg-muted px-4 py-3 cursor-pointer hover:bg-muted-hover active:bg-muted-pressed transition-colors"
                  flexDirection={BoxFlexDirection.Column}
                  onClick={handleOpenMarginMenu}
                  data-testid="perps-margin-card"
                >
                  <Box paddingBottom={1}>
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsMargin')}
                    </Text>
                  </Box>
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-position-margin-value"
                  >
                    {formatPerpsFiatMinimal(position.marginUsed)}
                  </Text>
                  <Popover
                    referenceElement={marginMenuRef.current}
                    isOpen={isMarginMenuOpen}
                    isPortal
                    onClickOutside={() => setIsMarginMenuOpen(false)}
                    onPressEscKey={() => setIsMarginMenuOpen(false)}
                    position={PopoverPosition.Top}
                    preventOverflow
                    flip
                    offset={[0, 8]}
                    padding={0}
                    className="min-w-[220px] rounded-lg z-[1050]"
                    data-testid="perps-margin-menu"
                  >
                    <Box flexDirection={BoxFlexDirection.Column}>
                      <PopoverMenuItem
                        icon={IconName.Add}
                        label={t('perpsAddMargin')}
                        description={t('perpsAddMarginDescription')}
                        onClick={handleOpenAddMarginModal}
                        className="rounded-t-lg py-3"
                        data-testid="perps-margin-menu-add"
                      />
                      <PopoverMenuItem
                        icon={IconName.Minus}
                        label={t('perpsRemoveMargin')}
                        description={t('perpsRemoveMarginDescription')}
                        onClick={handleOpenDecreaseMarginModal}
                        className="rounded-b-lg py-3"
                        data-testid="perps-margin-menu-remove"
                      />
                    </Box>
                  </Popover>
                </Box>
              </Box>

              {/* Third Row: Auto Close - Click to open modal */}
              <Box
                className="rounded-xl bg-muted cursor-pointer px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed transition-colors"
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                onClick={handleOpenTPSLModal}
                data-testid="perps-auto-close-row"
              >
                <Box flexDirection={BoxFlexDirection.Column}>
                  <Box paddingBottom={1}>
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsAutoClose')}
                    </Text>
                  </Box>
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    gap={1}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      TP{' '}
                    </Text>
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {position.takeProfitPrice
                        ? formatPerpsFiatUniversal(position.takeProfitPrice)
                        : '-'}
                    </Text>
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      , SL{' '}
                    </Text>
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {position.stopLossPrice
                        ? formatPerpsFiatUniversal(position.stopLossPrice)
                        : '-'}
                    </Text>
                  </Box>
                </Box>
                <Icon
                  name={IconName.ArrowRight}
                  size={IconSize.Sm}
                  color={IconColor.IconAlternative}
                />
              </Box>

              {/* Details Section */}
              <Box paddingTop={4} paddingBottom={2}>
                <Text
                  variant={TextVariant.HeadingSm}
                  fontWeight={FontWeight.Medium}
                >
                  {t('perpsDetails')}
                </Text>
              </Box>
              <Box flexDirection={BoxFlexDirection.Column}>
                {/* Direction Row */}
                <Box
                  className="rounded-t-xl bg-muted px-4 py-3"
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsDirection')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    color={
                      parseFloat(position.size) >= 0
                        ? TextColor.SuccessDefault
                        : TextColor.ErrorDefault
                    }
                    data-testid="perps-position-leverage"
                  >
                    {parseFloat(position.size) >= 0
                      ? t('perpsLong')
                      : t('perpsShort')}{' '}
                    {position.leverage.value}x
                  </Text>
                </Box>

                {/* Entry Price Row */}
                <Box
                  className="bg-muted px-4 py-3"
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsEntryPrice')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-position-entry-value"
                  >
                    {formatPerpsFiatUniversal(position.entryPrice)}
                  </Text>
                </Box>

                {/* Liquidation Price Row */}
                <Box
                  className="bg-muted px-4 py-3"
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsLiquidationPrice')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-position-liquidation-value"
                  >
                    {position.liquidationPrice
                      ? formatPerpsFiatUniversal(position.liquidationPrice)
                      : '-'}
                  </Text>
                </Box>

                {/* Funding Payments Row */}
                <Box
                  className="rounded-b-xl bg-muted px-4 py-3"
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsFundingPayments')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-position-funding-value"
                  >
                    {(() => {
                      const fundingSinceOpen = Number.parseFloat(
                        position.cumulativeFunding.sinceOpen,
                      );
                      const isNearZeroFunding =
                        Math.abs(fundingSinceOpen) < 0.005;
                      if (isNearZeroFunding) {
                        return '$0.00';
                      }
                      const signPrefix = fundingSinceOpen >= 0 ? '-' : '+';
                      return `${signPrefix}${formatPerpsFiat(
                        Math.abs(fundingSinceOpen),
                        { ranges: PRICE_RANGES_MINIMAL_VIEW },
                      )}`;
                    })()}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Orders Section - shown regardless of position, but only if there are orders */}
        {orders.length > 0 && (
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <Box paddingBottom={2}>
              <Text
                variant={TextVariant.HeadingSm}
                fontWeight={FontWeight.Medium}
              >
                {t('perpsOrders')}
              </Text>
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Column}
              className="overflow-hidden rounded-xl"
            >
              {orders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  variant="muted"
                  onClick={handleOrderClick}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Stats Section - always visible */}
        <Box paddingLeft={4} paddingRight={4}>
          <Box paddingTop={4} paddingBottom={2}>
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsStats')}
            </Text>
          </Box>
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="overflow-hidden rounded-xl"
          >
            {/* 24h Volume Row */}
            <Box
              className="bg-muted px-4 py-3"
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {t('perps24hVolume')}
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {market.volume}
              </Text>
            </Box>

            {/* Open Interest Row */}
            {market.openInterest && (
              <Box
                className="bg-muted px-4 py-3"
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
              >
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={1}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsOpenInterest')}
                  </Text>
                  <Tooltip
                    position="top"
                    html={t('perpsOpenInterestTooltip')}
                    interactive
                  >
                    <Icon
                      name={IconName.Info}
                      size={IconSize.Sm}
                      color={IconColor.IconAlternative}
                    />
                  </Tooltip>
                </Box>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {market.openInterest}
                </Text>
              </Box>
            )}

            {/* Funding Rate Row */}
            {market.fundingRate !== undefined && (
              <Box
                className="bg-muted px-4 py-3"
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
              >
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={1}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsFundingRate')}
                  </Text>
                  <Tooltip
                    position="top"
                    html={t('perpsFundingRateTooltip')}
                    interactive
                  >
                    <Icon
                      name={IconName.Info}
                      size={IconSize.Sm}
                      color={IconColor.IconAlternative}
                    />
                  </Tooltip>
                </Box>
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={1}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    color={
                      market.fundingRate >= 0
                        ? TextColor.SuccessDefault
                        : TextColor.ErrorDefault
                    }
                  >
                    {formatFundingRate(market.fundingRate)}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    ({fundingCountdown})
                  </Text>
                </Box>
              </Box>
            )}

            {/* Oracle Price Row */}
            <Box
              className="bg-muted px-4 py-3"
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsOraclePrice')}
                </Text>
                <Tooltip
                  position="top"
                  html={t('perpsOraclePriceTooltip')}
                  interactive
                >
                  <Icon
                    name={IconName.Info}
                    size={IconSize.Sm}
                    color={IconColor.IconAlternative}
                  />
                </Tooltip>
              </Box>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                data-testid="perps-market-detail-oracle-price"
              >
                {livePrice?.markPrice
                  ? formatPerpsFiatUniversal(livePrice.markPrice)
                  : '—'}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Recent Activity Section - always visible */}
        <Box paddingLeft={4} paddingRight={4}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            paddingTop={4}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsRecentActivity')}
            </Text>
            {recentActivityTransactions.length > 0 && (
              <ButtonBase
                onClick={() => navigate(PERPS_ACTIVITY_ROUTE)}
                className="bg-transparent hover:bg-transparent active:bg-transparent p-0 min-w-0 h-auto"
                data-testid="perps-market-detail-view-all-activity"
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsSeeAll')}
                </Text>
              </ButtonBase>
            )}
          </Box>
          {renderRecentActivityContent()}

          {/* Learn Section */}
          <Box
            className="mt-4 w-full cursor-pointer rounded-xl bg-muted px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed"
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            data-testid="perps-learn-basics"
            onClick={() => {
              track(MetaMetricsEventName.PerpsUiInteraction, {
                [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
                  PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
                [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
                  PERPS_EVENT_VALUE.BUTTON_CLICKED.TUTORIAL,
                [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
                  PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
              });
              dispatch(setTutorialModalOpen(true));
            }}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('perpsLearnBasics')}
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>

          {/* Disclaimer */}
          <Box paddingTop={4} paddingBottom={4}>
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {t('perpsDisclaimer')}
            </Text>
          </Box>
        </Box>
      </>

      {/* Sticky Footer */}
      <Box
        className="sticky bottom-0 left-0 right-0 bg-default border-t border-muted"
        paddingLeft={4}
        paddingRight={4}
        paddingTop={3}
        paddingBottom={4}
      >
        {/* With Position: Show Modify dropdown and Close button */}
        {position && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={3}
            data-testid="perps-position-cta-buttons"
          >
            {/* Modify dropdown */}
            <Box ref={modifyMenuRef} className="flex-1 min-w-0">
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                onClick={() => {
                  if (!isEligible) {
                    setIsGeoBlockModalOpen(true);
                    return;
                  }
                  setIsModifyMenuOpen((prev) => !prev);
                }}
                className="w-full flex items-center gap-2"
                data-testid="perps-modify-cta-button"
              >
                {t('perpsModify')}
                <Icon
                  name={
                    isModifyMenuOpen ? IconName.ArrowUp : IconName.ArrowDown
                  }
                  size={IconSize.Sm}
                  color={IconColor.IconDefault}
                />
              </Button>
              <Popover
                referenceElement={modifyMenuRef.current}
                isOpen={isModifyMenuOpen}
                isPortal
                onClickOutside={() => setIsModifyMenuOpen(false)}
                onPressEscKey={() => setIsModifyMenuOpen(false)}
                position={PopoverPosition.Top}
                preventOverflow
                flip
                offset={[0, 8]}
                padding={0}
                matchWidth
                className="rounded-lg z-[1050]"
                data-testid="perps-modify-menu"
              >
                <Box flexDirection={BoxFlexDirection.Column}>
                  <PopoverMenuItem
                    icon={IconName.Add}
                    label={t('perpsAddExposure')}
                    description={
                      parseFloat(position.size) >= 0
                        ? t('perpsAddExposureDescriptionLong')
                        : t('perpsAddExposureDescriptionShort')
                    }
                    onClick={handleAddExposure}
                    className="rounded-t-lg"
                    data-testid="perps-modify-menu-add-exposure"
                  />
                  <PopoverMenuItem
                    icon={IconName.Minus}
                    label={t('perpsReduceExposure')}
                    description={
                      parseFloat(position.size) >= 0
                        ? t('perpsReduceExposureDescriptionLong')
                        : t('perpsReduceExposureDescriptionShort')
                    }
                    onClick={handleReduceExposure}
                    data-testid="perps-modify-menu-reduce-exposure"
                  />
                  <PopoverMenuItem
                    icon={IconName.SwapHorizontal}
                    label={t('perpsReversePosition')}
                    description={
                      parseFloat(position.size) >= 0
                        ? t('perpsReversePositionDescriptionLong')
                        : t('perpsReversePositionDescriptionShort')
                    }
                    onClick={handleOpenReverseModal}
                    className="rounded-b-lg"
                    data-testid="perps-modify-menu-reverse-position"
                  />
                </Box>
              </Popover>
            </Box>

            {/* Close Button - White / Primary style */}
            <Box className="flex-1 min-w-0">
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                onClick={handleClosePosition}
                className="w-full"
                data-testid="perps-close-cta-button"
              >
                {parseFloat(position.size) >= 0
                  ? t('perpsCloseLong')
                  : t('perpsCloseShort')}
              </Button>
            </Box>
          </Box>
        )}

        {/* Without Position: Show Long and Short buttons */}
        {!position && hasNoAvailableBalance && (
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleAddFunds}
            disabled={!selectedAddress || isDepositLoading}
            className="w-full"
            data-testid="perps-add-funds-cta-button"
          >
            {t('addFunds')}
          </Button>
        )}

        {!position && !hasNoAvailableBalance && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={3}
            data-testid="perps-trade-cta-buttons"
          >
            {/* Long Button */}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={() => handleOpenOrder('long')}
              disabled={isLoadingAccount}
              className="flex-1"
              data-testid="perps-long-cta-button"
            >
              {t('perpsLong')}
            </Button>

            {/* Short Button */}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={() => handleOpenOrder('short')}
              disabled={isLoadingAccount}
              className="flex-1"
              data-testid="perps-short-cta-button"
            >
              {t('perpsShort')}
            </Button>
          </Box>
        )}
      </Box>

      {/* Add / Decrease margin modals (from Modify menu) */}
      {position && selectedAddress && marginModalMode && (
        <EditMarginModal
          isOpen={marginModalMode !== null}
          onClose={handleCloseMarginModal}
          position={position}
          account={account}
          currentPrice={currentPrice}
          mode={marginModalMode}
        />
      )}

      {/* Reverse position modal (from Modify menu) */}
      {position && isReverseModalOpen && (
        <ReversePositionModal
          isOpen={isReverseModalOpen}
          onClose={handleCloseReverseModal}
          position={position}
          currentPrice={currentPrice}
          sizeDecimals={marketInfo?.szDecimals}
        />
      )}

      {/* TP/SL update modal (from Auto Close row) */}
      {position && isTPSLModalOpen && (
        <UpdateTPSLModal
          key={position.symbol}
          isOpen={isTPSLModalOpen}
          onClose={handleCloseTPSLModal}
          position={position}
          currentPrice={currentPrice}
        />
      )}

      {/* Close position modal */}
      {position && isCloseModalOpen && (
        <ClosePositionModal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          position={position}
          currentPrice={currentPrice}
          sizeDecimals={marketInfo?.szDecimals}
        />
      )}

      {/* Cancel order modal */}
      {cancelOrderTarget && (
        <CancelOrderModal
          isOpen={cancelOrderTarget !== null}
          onClose={() => setCancelOrderTarget(null)}
          order={cancelOrderTarget}
        />
      )}

      {/* Tutorial modal — opened via "Learn the basics of perps" */}
      <PerpsTutorialModal />

      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </Box>
  );
};

export default PerpsMarketDetailPage;
