import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PERPS_ORDER_ENTRY_ROUTE,
} from '../../helpers/constants/routes';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveAccount,
  usePerpsLiveMarketData,
  usePerpsLiveCandles,
} from '../../hooks/perps/stream';
import { usePerpsEligibility } from '../../hooks/perps';
import { getPerpsController } from '../../providers/perps';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';
import { OrderCard } from '../../components/app/perps/order-card';
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
} from '../../components/app/perps/utils';
import { PerpsDetailPageSkeleton } from '../../components/app/perps/perps-skeletons';
import { Skeleton } from '../../components/component-library/skeleton';
import { useFormatters } from '../../hooks/useFormatters';
import { EditMarginModal } from '../../components/app/perps/edit-margin';
import { ReversePositionModal } from '../../components/app/perps/reverse-position';
import { UpdateTPSLModal } from '../../components/app/perps/update-tpsl';
import InfoTooltip from '../../components/ui/info-tooltip/info-tooltip';
import { BorderRadius } from '../../helpers/constants/design-system';
import type { CandleStick, PriceUpdate } from '@metamask/perps-controller';

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

/**
 * PerpsMarketDetailPage component
 * Displays detailed market information for a specific perps market
 * Accessible via /perps/market/:symbol route
 */
const PerpsMarketDetailPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const isPerpsEnabled = useSelector(getIsPerpsEnabled);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { isEligible } = usePerpsEligibility();
  const {
    formatCurrencyWithMinThreshold,
    formatNumber,
    formatPercentWithMinThreshold,
  } = useFormatters();
  const fundingCountdown = useFundingCountdown();

  // Use stream hooks for real-time data
  const { positions: allPositions } = usePerpsLivePositions();
  const { orders: allOrders } = usePerpsLiveOrders();
  const { account } = usePerpsLiveAccount();
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  // Safely decode the symbol from URL
  const decodedSymbol = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    return safeDecodeURIComponent(symbol);
  }, [symbol]);

  // Subscribe to live price data for current symbol (provides oracle price, live funding, OI)
  // Uses getPerpsController (module singleton) since this page is outside PerpsControllerProvider
  const [livePrice, setLivePrice] = useState<PriceUpdate | undefined>(
    undefined,
  );
  useEffect(() => {
    if (!decodedSymbol || !selectedAddress) {
      setLivePrice(undefined);
      return undefined;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const subscribe = async () => {
      try {
        const controller = await getPerpsController(selectedAddress);
        if (cancelled) {
          return;
        }
        unsubscribe = controller.subscribeToPrices({
          symbols: [decodedSymbol],
          includeMarketData: true,
          callback: (priceUpdates) => {
            const update = priceUpdates.find((p) => p.symbol === decodedSymbol);
            if (update) {
              const ts = (update as { timestamp?: number }).timestamp;
              const mark = (update as { markPrice?: string }).markPrice;
              setLivePrice({
                symbol: update.symbol,
                price: update.price,
                timestamp: ts ?? Date.now(),
                markPrice: mark ?? update.price,
              });
            }
          },
          throttleMs: 1000,
        });
      } catch {
        // Controller not ready yet, skip silently
      }
    };

    subscribe();

    return () => {
      cancelled = true;
      unsubscribe?.();
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

  // Find position for this market (if exists)
  const position = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return allPositions.find(
      (pos) => pos.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [decodedSymbol, allPositions]);

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

  // Find user-placed limit orders resting on the orderbook for this market.
  // Excludes all position-attached orders:
  // - isTrigger: TP/SL trigger orders
  // - reduceOnly: close/reduce orders tied to positions
  // - triggerPrice: any order with a trigger condition (TP/SL variant)
  // - detailedOrderType containing "Take Profit" or "Stop" (belt-and-suspenders)
  const orders = useMemo(() => {
    if (!decodedSymbol) {
      return [];
    }
    return allOrders.filter((order) => {
      if (order.symbol.toLowerCase() !== decodedSymbol.toLowerCase()) {
        return false;
      }
      if (order.status !== 'open') {
        return false;
      }
      // Exclude position-attached orders
      if (order.isTrigger || order.reduceOnly || order.triggerPrice) {
        return false;
      }
      const detailed = order.detailedOrderType?.toLowerCase() ?? '';
      if (detailed.includes('take profit') || detailed.includes('stop')) {
        return false;
      }
      return true;
    });
  }, [decodedSymbol, allOrders]);

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

  // OHLCV bar state: the candle currently hovered by crosshair (null = no hover)
  const [hoveredCandle, setHoveredCandle] = useState<CandleStick | null>(null);

  const [isModifyMenuOpen, setIsModifyMenuOpen] = useState(false);
  const [marginModalMode, setMarginModalMode] = useState<
    'add' | 'remove' | null
  >(null);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isTPSLModalOpen, setIsTPSLModalOpen] = useState(false);
  const modifyMenuRef = useRef<HTMLDivElement>(null);

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
      return `$${formatNumber(chartCurrentPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return market?.price ?? '$0.00';
  }, [chartCurrentPrice, market, formatNumber]);

  // 24h change from market data.
  // TODO: When PerpsControllerProvider is available in the route tree,
  // subscribe to usePerpsLivePrices for live 24h change updates.
  const displayChange = market?.change24hPercent ?? '';

  // Build price lines for chart overlay (current price + TP, Entry, SL)
  // Current price line is always shown; TP/Entry/SL only when position exists.
  const chartPriceLines = useMemo((): ChartPriceLine[] => {
    const lines: ChartPriceLine[] = [];

    // Current price line — always shown, derived from last candle close
    if (chartCurrentPrice > 0) {
      lines.push({
        price: chartCurrentPrice,
        label: '',
        color: 'rgba(255, 255, 255, 0.3)',
        lineStyle: 2,
        lineWidth: 2,
      });
    }

    // Position-specific lines (only when user has an open position)
    if (position) {
      // Take Profit line (green/lime, dashed)
      if (position.takeProfitPrice) {
        const tpPrice = parseFloat(position.takeProfitPrice.replace(/,/gu, ''));
        if (!isNaN(tpPrice) && tpPrice > 0) {
          lines.push({
            price: tpPrice,
            label: 'TP',
            color: brandColor.lime100,
            lineStyle: 2,
          });
        }
      }

      // Entry price line (gray, dashed)
      if (position.entryPrice) {
        const entryPrice = parseFloat(position.entryPrice.replace(/,/gu, ''));
        if (!isNaN(entryPrice) && entryPrice > 0) {
          lines.push({
            price: entryPrice,
            label: 'Entry',
            color: 'rgba(255, 255, 255, 0.5)',
            lineStyle: 2,
          });
        }
      }

      // Stop Loss line (red, dashed)
      if (position.stopLossPrice) {
        const slPrice = parseFloat(position.stopLossPrice.replace(/,/gu, ''));
        if (!isNaN(slPrice) && slPrice > 0) {
          lines.push({
            price: slPrice,
            label: 'SL',
            color: brandColor.red300,
            lineStyle: 2,
          });
        }
      }
    }

    return lines;
  }, [position, chartCurrentPrice]);

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
    (direction: 'long' | 'short', mode: 'new' | 'modify' | 'close') => {
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
      if (!isEligible || !decodedSymbol) {
        return;
      }
      navigate(buildOrderEntryUrl(direction, 'new'));
    },
    [isEligible, decodedSymbol, navigate, buildOrderEntryUrl],
  );

  const handleClosePosition = useCallback(() => {
    if (!isEligible || !position || !decodedSymbol) {
      return;
    }
    const isLong = parseFloat(position.size) >= 0;
    navigate(buildOrderEntryUrl(isLong ? 'long' : 'short', 'close'));
  }, [isEligible, position, decodedSymbol, navigate, buildOrderEntryUrl]);

  // Close modify menu when clicking outside
  useEffect(() => {
    if (!isModifyMenuOpen) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modifyMenuRef.current &&
        !modifyMenuRef.current.contains(e.target as Node)
      ) {
        setIsModifyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModifyMenuOpen]);

  const handleOpenAddMarginModal = useCallback(() => {
    setIsModifyMenuOpen(false);
    setMarginModalMode('add');
  }, []);

  const handleOpenDecreaseMarginModal = useCallback(() => {
    setIsModifyMenuOpen(false);
    setMarginModalMode('remove');
  }, []);

  const handleOpenReverseModal = useCallback(() => {
    setIsModifyMenuOpen(false);
    setIsReverseModalOpen(true);
  }, []);

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

  // Refetch positions when tab becomes visible (catch changes made elsewhere)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && selectedAddress) {
        try {
          const controller = await getPerpsController(selectedAddress);
          const positions = await controller.getPositions({ skipCache: true });
          getPerpsStreamManager().pushPositionsWithOverrides(positions);
        } catch (e) {
          console.warn('[Perps] Visibility refetch failed:', e);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [selectedAddress]);

  // No-op handler for order cards - orders on detail page are already
  // filtered to current market, so clicking should not navigate anywhere
  const handleOrderClick = useCallback(() => undefined, []);

  // Guard: redirect if perps feature is disabled
  if (!isPerpsEnabled) {
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
        onCrosshairMove={setHoveredCandle}
      />
    );
  };

  return (
    <Box
      className="main-container asset__container"
      data-testid="perps-market-detail-page"
    >
      {/* Header */}
      <Box
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
          aria-label={t('perpsAddToFavorites')}
          className="p-2 cursor-pointer"
          onClick={() => {
            // TODO: Handle favorite toggle
          }}
        >
          <Icon
            name={IconName.Star}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>
      </Box>

      {/* OHLCV Bar — shown when crosshair hovers a candle */}
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
                    {parseFloat(position.unrealizedPnl) >= 0 ? '+' : '-'}
                    {formatCurrencyWithMinThreshold(
                      Math.abs(parseFloat(position.unrealizedPnl)),
                      'USD',
                    )}
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
                    {formatPercentWithMinThreshold(
                      parseFloat(position.returnOnEquity),
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
                    // TODO: Handle size card press
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
                  >
                    {`${formatNumber(Math.abs(parseFloat(position.size)), { maximumSignificantDigits: 4 })} ${getDisplayName(position.symbol)}`}
                  </Text>
                </Box>

                {/* Margin Card - display only; add/remove margin via Modify menu */}
                <Box
                  className="flex-1 rounded-xl bg-muted px-4 py-3"
                  flexDirection={BoxFlexDirection.Column}
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
                  >
                    {formatCurrencyWithMinThreshold(
                      parseFloat(position.marginUsed),
                      'USD',
                    )}
                  </Text>
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
                        ? `$${position.takeProfitPrice}`
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
                        ? `$${position.stopLossPrice}`
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
                  >
                    {parseFloat(position.size) >= 0
                      ? t('perpsLong')
                      : t('perpsShort')}
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
                  >
                    ${position.entryPrice}
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
                  >
                    {position.liquidationPrice
                      ? `$${position.liquidationPrice}`
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
                  >
                    ${position.cumulativeFunding.sinceOpen}
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
                  <InfoTooltip
                    position="top"
                    contentText={t('perpsOpenInterestTooltip')}
                  />
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
                  <InfoTooltip
                    position="top"
                    contentText={t('perpsFundingRateTooltip')}
                  />
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
                    {market.fundingRate >= 0 ? '+' : ''}
                    {formatNumber(market.fundingRate * 100, {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                    %
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
                <InfoTooltip
                  position="top"
                  contentText={t('perpsOraclePriceTooltip')}
                />
              </Box>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {livePrice?.markPrice
                  ? formatCurrencyWithMinThreshold(
                      parseFloat(livePrice.markPrice),
                      'USD',
                    )
                  : '—'}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Recent Activity Section - always visible */}
        <Box paddingLeft={4} paddingRight={4}>
          <Box paddingTop={4} paddingBottom={2}>
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsRecentActivity')}
            </Text>
          </Box>
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="overflow-hidden rounded-xl"
          >
            {/* Activity Item 1 - Opened long */}
            <Box
              className="w-full bg-muted px-4 py-3"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <PerpsTokenLogo
                symbol={market.symbol}
                size={AvatarTokenSize.Md}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="min-w-0 flex-1"
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {t('perpsOpenedLong')}
                </Text>
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                >
                  2.50000 {displayName}
                </Text>
              </Box>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.SuccessDefault}
              >
                +$125.00
              </Text>
            </Box>

            {/* Activity Item 2 - Increased position */}
            <Box
              className="w-full bg-muted px-4 py-3"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <PerpsTokenLogo
                symbol={market.symbol}
                size={AvatarTokenSize.Md}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="min-w-0 flex-1"
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {t('perpsIncreasedPosition')}
                </Text>
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                >
                  0.50000 {displayName}
                </Text>
              </Box>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.SuccessDefault}
              >
                +$45.20
              </Text>
            </Box>

            {/* Activity Item 3 - Closed short */}
            <Box
              className="w-full bg-muted px-4 py-3"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <PerpsTokenLogo
                symbol={market.symbol}
                size={AvatarTokenSize.Md}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="min-w-0 flex-1"
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {t('perpsClosedShort')}
                </Text>
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                >
                  1.25000 {displayName}
                </Text>
              </Box>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.ErrorDefault}
              >
                -$32.50
              </Text>
            </Box>
          </Box>

          {/* Learn Section */}
          <Box
            className="mt-4 w-full cursor-pointer rounded-xl bg-muted px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed"
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            onClick={() => {
              // TODO: Navigate to learn page
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
            <Box ref={modifyMenuRef} className="relative flex-1">
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                onClick={() => setIsModifyMenuOpen((prev) => !prev)}
                disabled={!isEligible}
                title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
                className="w-full flex items-center justify-between gap-2"
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
              {isModifyMenuOpen && (
                <Box
                  className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg"
                  flexDirection={BoxFlexDirection.Column}
                  data-testid="perps-modify-menu"
                >
                  <ButtonBase
                    className="w-full text-left rounded-none px-3 py-2 bg-transparent hover:bg-hover active:bg-pressed"
                    onClick={handleOpenAddMarginModal}
                    data-testid="perps-modify-menu-add-margin"
                  >
                    <Text variant={TextVariant.BodySm}>
                      {t('perpsAddMargin')}
                    </Text>
                  </ButtonBase>
                  <ButtonBase
                    className="w-full text-left rounded-none px-3 py-2 bg-transparent hover:bg-hover active:bg-pressed"
                    onClick={handleOpenDecreaseMarginModal}
                    data-testid="perps-modify-menu-decrease-margin"
                  >
                    <Text variant={TextVariant.BodySm}>
                      {t('perpsRemoveMargin')}
                    </Text>
                  </ButtonBase>
                  <ButtonBase
                    className="w-full text-left rounded-none px-3 py-2 bg-transparent hover:bg-hover active:bg-pressed"
                    onClick={handleOpenReverseModal}
                    data-testid="perps-modify-menu-reverse-position"
                  >
                    <Text variant={TextVariant.BodySm}>
                      {t('perpsReversePosition')}
                    </Text>
                  </ButtonBase>
                </Box>
              )}
            </Box>

            {/* Close Button - White / Primary style */}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={handleClosePosition}
              disabled={!isEligible}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
              className="flex-1"
              data-testid="perps-close-cta-button"
            >
              {parseFloat(position.size) >= 0
                ? t('perpsCloseLong')
                : t('perpsCloseShort')}
            </Button>
          </Box>
        )}

        {/* Without Position: Show Long and Short buttons */}
        {!position && (
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
              disabled={!isEligible}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
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
              disabled={!isEligible}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
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
          selectedAddress={selectedAddress}
          mode={marginModalMode}
        />
      )}

      {/* Reverse position modal (from Modify menu) */}
      {position && selectedAddress && isReverseModalOpen && (
        <ReversePositionModal
          isOpen={isReverseModalOpen}
          onClose={handleCloseReverseModal}
          position={position}
          currentPrice={currentPrice}
          selectedAddress={selectedAddress}
        />
      )}

      {/* TP/SL update modal (from Auto Close row) */}
      {position && selectedAddress && isTPSLModalOpen && (
        <UpdateTPSLModal
          isOpen={isTPSLModalOpen}
          onClose={handleCloseTPSLModal}
          position={position}
          currentPrice={currentPrice}
          selectedAddress={selectedAddress}
        />
      )}
    </Box>
  );
};

export default PerpsMarketDetailPage;
