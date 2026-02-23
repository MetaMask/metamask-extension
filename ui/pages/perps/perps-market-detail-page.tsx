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
  twMerge,
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
} from '@metamask/design-system-react';
import { brandColor } from '@metamask/design-tokens';
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
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
import {
  OrderEntry,
  type OrderDirection,
  type OrderFormState,
  type OrderMode,
} from '../../components/app/perps/order-entry';
import { EditMarginExpandable } from '../../components/app/perps/edit-margin';
import { TextField, TextFieldSize } from '../../components/component-library';
import InfoTooltip from '../../components/ui/info-tooltip/info-tooltip';
import {
  BorderRadius,
  BackgroundColor,
} from '../../helpers/constants/design-system';
import type {
  CandleStick,
  OrderType,
  OrderParams,
  PriceUpdate,
} from '@metamask/perps-controller';

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

// Preset percentage options for quick selection (matching AutoCloseSection)
const TP_PRESETS = [10, 25, 50, 100];
const SL_PRESETS = [10, 25, 50, 75];

/**
 * Convert UI OrderFormState to PerpsController OrderParams
 *
 * @param formState - The form state from OrderEntry component
 * @param currentPrice - Current market price
 * @param mode - Order mode ('new', 'modify', 'close')
 * @param existingPositionSize - Size of existing position (for close/modify modes)
 * @returns OrderParams for the PerpsController
 */
function formStateToOrderParams(
  formState: OrderFormState,
  currentPrice: number,
  mode: OrderMode,
  existingPositionSize?: string,
): OrderParams {
  const isBuy = formState.direction === 'long';

  // Calculate position size from margin and leverage
  // Position size = (margin * leverage) / price
  const marginAmount = parseFloat(formState.amount) || 0;
  const positionSize = (marginAmount * formState.leverage) / currentPrice;

  // For close mode, use the existing position size
  const size =
    mode === 'close' && existingPositionSize
      ? Math.abs(parseFloat(existingPositionSize)).toString()
      : positionSize.toString();

  // Clean commas from formatted values before sending to API
  const cleanAmount = formState.amount.replace(/,/gu, '');

  const params: OrderParams = {
    symbol: formState.asset,
    isBuy,
    size,
    orderType: formState.type,
    leverage: formState.leverage,
    currentPrice,
    usdAmount: cleanAmount,
  };

  // Add limit price for limit orders
  if (formState.type === 'limit' && formState.limitPrice) {
    params.price = formState.limitPrice.replace(/,/gu, '');
  }

  // Add take profit if set and auto-close is enabled
  // Clean commas from formatted price values before sending to API
  if (formState.autoCloseEnabled && formState.takeProfitPrice) {
    params.takeProfitPrice = formState.takeProfitPrice.replace(/,/gu, '');
  }

  // Add stop loss if set and auto-close is enabled
  // Clean commas from formatted price values before sending to API
  if (formState.autoCloseEnabled && formState.stopLossPrice) {
    params.stopLossPrice = formState.stopLossPrice.replace(/,/gu, '');
  }

  // Mark as reduce only for close mode
  if (mode === 'close') {
    params.reduceOnly = true;
    params.isFullClose = true;
  }

  return params;
}

/**
 * View state for the market detail page
 * - 'detail': Shows market info, position, stats
 * - 'order': Shows the order entry form
 */
type MarketDetailView = 'detail' | 'order';

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

  // Subscribe to top-of-book data for limit price presets (bid, ask, mid)
  // Uses the same getPerpsController async pattern as live price subscription
  const [topOfBook, setTopOfBook] = useState<{
    midPrice: number;
    bidPrice: number;
    askPrice: number;
  } | null>(null);
  useEffect(() => {
    if (!decodedSymbol || !selectedAddress) {
      setTopOfBook(null);
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
        unsubscribe = controller.subscribeToOrderBook({
          symbol: decodedSymbol,
          levels: 1,
          nSigFigs: 5,
          mantissa: 2,
          callback: (orderBook) => {
            if (
              orderBook.bids.length > 0 &&
              orderBook.asks.length > 0 &&
              orderBook.midPrice
            ) {
              setTopOfBook({
                midPrice: parseFloat(orderBook.midPrice),
                bidPrice: parseFloat(orderBook.bids[0].price),
                askPrice: parseFloat(orderBook.asks[0].price),
              });
            }
          },
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

  // View state: 'detail' or 'order'
  const [currentView, setCurrentView] = useState<MarketDetailView>('detail');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);
  const [orderFormState, setOrderFormState] = useState<OrderFormState | null>(
    null,
  );
  // Order mode: 'new' for opening, 'modify' for adjusting, 'close' for closing
  const [orderMode, setOrderMode] = useState<OrderMode>('new');

  // Order submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Track pending order waiting for position to appear in stream
  const [pendingOrderSymbol, setPendingOrderSymbol] = useState<string | null>(
    null,
  );

  // Derived state: true when submitting OR waiting for position confirmation
  const isOrderPending = isSubmitting || pendingOrderSymbol !== null;

  // Limit order validation: submit is disabled when limit price is empty or invalid
  const isLimitPriceInvalid = useMemo(() => {
    if (orderType !== 'limit' || !orderFormState) {
      return false;
    }
    const cleaned = orderFormState.limitPrice?.replace(/,/gu, '') ?? '';
    const parsed = parseFloat(cleaned);
    return !cleaned || isNaN(parsed) || parsed <= 0;
  }, [orderType, orderFormState]);

  // Combined submit disabled state
  const isSubmitDisabled = !isEligible || isOrderPending || isLimitPriceInvalid;

  // Auto close card expansion state
  const [isAutoCloseExpanded, setIsAutoCloseExpanded] = useState(false);
  const [isMarginExpanded, setIsMarginExpanded] = useState(false);
  const [editingTpPrice, setEditingTpPrice] = useState<string>('');
  const [editingSlPrice, setEditingSlPrice] = useState<string>('');
  const [isSavingTPSL, setIsSavingTPSL] = useState(false);
  const [tpslError, setTpslError] = useState<string | null>(null);

  // Derived state: true when saving TP/SL
  // Note: We no longer need to track pending state because we directly push
  // fresh data to the stream after a successful API call
  const isTPSLPending = isSavingTPSL;

  // Helper: format price for display (with locale-aware formatting)
  const formatEditPrice = useCallback(
    (value: number): string => {
      return formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [formatNumber],
  );

  // Helper: format percentage for display
  const formatEditPercent = useCallback(
    (value: number): string => {
      return formatNumber(value, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    },
    [formatNumber],
  );

  // Get available balance from account state
  const availableBalance = account ? parseFloat(account.availableBalance) : 0;

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

  // Parse max leverage from market data (remove 'x')
  const maxLeverage = useMemo(() => {
    if (!market) {
      return 50;
    }
    return parseInt(market.maxLeverage.replace('x', ''), 10);
  }, [market]);

  // Get position direction for TP/SL calculations (default to long if no position)
  const positionDirection = useMemo(() => {
    if (!position) {
      return 'long';
    }
    return parseFloat(position.size) >= 0 ? 'long' : 'short';
  }, [position]);

  // Use entry price for existing position, or current price for display
  const entryPriceForEdit = useMemo(() => {
    if (position?.entryPrice) {
      return parseFloat(position.entryPrice.replace(/,/gu, ''));
    }
    return currentPrice;
  }, [position, currentPrice]);

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

  // Convert price to percentage for display
  const priceToPercentForEdit = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !entryPriceForEdit) {
        return '';
      }
      const cleanPrice = price.replace(/,/gu, '');
      const priceNum = parseFloat(cleanPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        return '';
      }

      const diff = priceNum - entryPriceForEdit;
      const percentChange = (diff / entryPriceForEdit) * 100;

      // For long: TP is above entry (positive %), SL is below entry (show as positive loss %)
      // For short: TP is below entry (show as positive profit %), SL is above entry (show as positive loss %)
      if (positionDirection === 'long') {
        return formatEditPercent(isTP ? percentChange : -percentChange);
      }
      return formatEditPercent(isTP ? -percentChange : percentChange);
    },
    [entryPriceForEdit, positionDirection, formatEditPercent],
  );

  // Convert percentage to price
  const percentToPriceForEdit = useCallback(
    (percent: number, isTP: boolean): string => {
      if (!entryPriceForEdit || percent === 0) {
        return '';
      }

      // For long: TP = entry * (1 + %), SL = entry * (1 - %)
      // For short: TP = entry * (1 - %), SL = entry * (1 + %)
      let multiplier: number;
      if (positionDirection === 'long') {
        multiplier = isTP ? 1 + percent / 100 : 1 - percent / 100;
      } else {
        multiplier = isTP ? 1 - percent / 100 : 1 + percent / 100;
      }

      const price = entryPriceForEdit * multiplier;
      return formatEditPrice(price);
    },
    [entryPriceForEdit, positionDirection, formatEditPrice],
  );

  // Computed percentage values for TP/SL editing
  const editingTpPercent = useMemo(
    () => priceToPercentForEdit(editingTpPrice, true),
    [priceToPercentForEdit, editingTpPrice],
  );

  const editingSlPercent = useMemo(
    () => priceToPercentForEdit(editingSlPrice, false),
    [priceToPercentForEdit, editingSlPrice],
  );

  // Handlers for TP preset buttons
  const handleTpPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, true);
      setEditingTpPrice(newPrice);
    },
    [percentToPriceForEdit],
  );

  // Handlers for SL preset buttons
  const handleSlPresetClick = useCallback(
    (percent: number) => {
      const newPrice = percentToPriceForEdit(percent, false);
      setEditingSlPrice(newPrice);
    },
    [percentToPriceForEdit],
  );

  // Handler for TP percentage input change (bidirectional)
  const handleTpPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*\.?\d*$/u.test(value)) {
        const numValue = parseFloat(value);
        if (value === '' || value === '-') {
          setEditingTpPrice('');
        } else if (!isNaN(numValue)) {
          const newPrice = percentToPriceForEdit(numValue, true);
          setEditingTpPrice(newPrice);
        }
      }
    },
    [percentToPriceForEdit],
  );

  // Handler for SL percentage input change (bidirectional)
  const handleSlPercentInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*\.?\d*$/u.test(value)) {
        const numValue = parseFloat(value);
        if (value === '' || value === '-') {
          setEditingSlPrice('');
        } else if (!isNaN(numValue)) {
          const newPrice = percentToPriceForEdit(numValue, false);
          setEditingSlPrice(newPrice);
        }
      }
    },
    [percentToPriceForEdit],
  );

  // Handler for TP price input blur (format the value)
  const handleTpPriceBlur = useCallback(() => {
    if (editingTpPrice) {
      const numValue = parseFloat(editingTpPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        setEditingTpPrice(formatEditPrice(numValue));
      }
    }
  }, [editingTpPrice, formatEditPrice]);

  // Handler for SL price input blur (format the value)
  const handleSlPriceBlur = useCallback(() => {
    if (editingSlPrice) {
      const numValue = parseFloat(editingSlPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        setEditingSlPrice(formatEditPrice(numValue));
      }
    }
  }, [editingSlPrice, formatEditPrice]);

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

  // Navigation handlers - use history back to return to wherever user came from
  // (perps home page or perps tab)
  const handleBackClick = useCallback(() => {
    // If in order view, go back to detail view and reset mode
    if (currentView === 'order') {
      setCurrentView('detail');
      setOrderMode('new'); // Reset mode when leaving order view
      return;
    }
    navigate(-1);
  }, [navigate, currentView]);

  // Handle opening order entry with a specific direction (new order)
  const handleOpenOrder = useCallback(
    (direction: OrderDirection) => {
      if (!isEligible) {
        return;
      }
      setOrderDirection(direction);
      setOrderMode('new');
      setCurrentView('order');
    },
    [isEligible],
  );

  // Handle modifying an existing position
  const handleModifyPosition = useCallback(() => {
    if (!isEligible || !position) {
      return;
    }
    const isLong = parseFloat(position.size) >= 0;
    setOrderDirection(isLong ? 'long' : 'short');
    setOrderMode('modify');
    setCurrentView('order');
  }, [isEligible, position]);

  // Handle closing an existing position
  const handleClosePosition = useCallback(() => {
    if (!isEligible || !position) {
      return;
    }
    const isLong = parseFloat(position.size) >= 0;
    setOrderDirection(isLong ? 'long' : 'short');
    setOrderMode('close');
    setCurrentView('order');
  }, [isEligible, position]);

  // Handle form state changes from OrderEntry
  const handleFormStateChange = useCallback((formState: OrderFormState) => {
    setOrderFormState(formState);
  }, []);

  // Memoize existingPosition so it only changes when position data actually changes.
  // Without this, a new object is created on every render, causing usePerpsOrderForm
  // to reset form state (including TP/SL inputs) and overwriting user edits.
  const existingPositionForOrder = useMemo(() => {
    if (!position) {
      return undefined;
    }
    return {
      size: position.size,
      leverage: position.leverage.value,
      entryPrice: position.entryPrice,
      takeProfitPrice: position.takeProfitPrice,
      stopLossPrice: position.stopLossPrice,
    };
  }, [position]);

  // Handle order submission
  const handleOrderSubmit = useCallback(async () => {
    if (!isEligible || !orderFormState || !selectedAddress) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get the controller lazily when submitting (avoids hook initialization issues)
      const controller = await getPerpsController(selectedAddress);

      if (orderMode === 'close' && position) {
        // Close position mode - don't pass size to close full position
        // The controller will automatically close the entire position when size is omitted
        const closeParams = {
          symbol: orderFormState.asset,
          // Market order type for immediate execution
          orderType: 'market' as const,
          // Current price is required for slippage calculation
          currentPrice,
        };
        const result = await controller.closePosition(closeParams);
        if (!result.success) {
          throw new Error(result.error || 'Failed to close position');
        }
      } else if (orderMode === 'modify' && position) {
        // Modify position mode - always update TP/SL (pass undefined to clear when disabled)
        // Strip commas from formatted price strings before sending to API
        const cleanTp =
          orderFormState.autoCloseEnabled && orderFormState.takeProfitPrice
            ? orderFormState.takeProfitPrice.replace(/,/gu, '')
            : undefined;
        const cleanSl =
          orderFormState.autoCloseEnabled && orderFormState.stopLossPrice
            ? orderFormState.stopLossPrice.replace(/,/gu, '')
            : undefined;
        const tpslParams = {
          symbol: orderFormState.asset,
          takeProfitPrice: cleanTp || undefined,
          stopLossPrice: cleanSl || undefined,
        };
        const result = await controller.updatePositionTPSL(tpslParams);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update TP/SL');
        }
      } else {
        // New order mode
        const orderParams = formStateToOrderParams(
          orderFormState,
          currentPrice,
          orderMode,
          position?.size,
        );
        const result = await controller.placeOrder(orderParams);
        if (!result.success) {
          throw new Error(result.error || 'Failed to place order');
        }

        if (orderFormState.type === 'limit') {
          // Limit orders rest on the orderbook — return to detail view immediately.
          // The resting order will appear in the orders section via usePerpsLiveOrders stream.
          setCurrentView('detail');
          setOrderMode('new');
          return;
        }

        // Market orders — wait for position to appear in stream before navigating
        setPendingOrderSymbol(orderFormState.asset);
        return; // Don't navigate yet, wait for stream confirmation
      }

      // Success for close/modify - return to detail view immediately
      setCurrentView('detail');
      setOrderMode('new');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isEligible,
    orderFormState,
    selectedAddress,
    orderMode,
    position,
    currentPrice,
  ]);

  // Initialize TP/SL editing values only when the card is first expanded
  // We use a ref to track if we've already initialized to prevent stream updates
  // from overwriting user edits
  const hasInitializedTpsl = useRef(false);

  useEffect(() => {
    // Reset the initialization flag when card is collapsed
    if (!isAutoCloseExpanded) {
      hasInitializedTpsl.current = false;
      return;
    }

    // Only initialize once when the card is first expanded
    if (isAutoCloseExpanded && position && !hasInitializedTpsl.current) {
      setEditingTpPrice(position.takeProfitPrice ?? '');
      setEditingSlPrice(position.stopLossPrice ?? '');
      setTpslError(null);
      hasInitializedTpsl.current = true;
    }
  }, [isAutoCloseExpanded, position]);

  // Handle auto close card toggle
  const handleAutoCloseToggle = useCallback(() => {
    setIsAutoCloseExpanded((prev) => !prev);
    setIsMarginExpanded(false);
    setTpslError(null);
  }, []);

  // Handle margin card toggle (expand/collapse edit margin section)
  const handleMarginToggle = useCallback(() => {
    setIsMarginExpanded((prev) => !prev);
    setIsAutoCloseExpanded(false);
  }, []);

  // Handle saving TP/SL changes
  // Uses positionRef to avoid stale position data in the callback
  // (following mobile's currentPositionRef pattern)
  const handleSaveTPSL = useCallback(async () => {
    if (!isEligible) {
      return;
    }
    const currentPosition = positionRef.current;
    if (!selectedAddress || !currentPosition) {
      return;
    }

    setIsSavingTPSL(true);
    setTpslError(null);

    try {
      const controller = await getPerpsController(selectedAddress);

      // Clean price strings (remove commas from formatted values)
      const cleanTpPrice = editingTpPrice.replace(/,/gu, '').trim();
      const cleanSlPrice = editingSlPrice.replace(/,/gu, '').trim();

      const tpslParams = {
        symbol: currentPosition.symbol,
        // Send undefined to clear, or the price string if set
        takeProfitPrice: cleanTpPrice || undefined,
        stopLossPrice: cleanSlPrice || undefined,
      };

      const result = await controller.updatePositionTPSL(tpslParams);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update TP/SL');
      }

      // Set optimistic override - this preserves user-set values when
      // WebSocket sends stale data (HyperLiquid has a delay in reflecting
      // new TP/SL trigger orders via the stream)
      const streamManager = getPerpsStreamManager();
      streamManager.setOptimisticTPSL(
        currentPosition.symbol,
        cleanTpPrice || undefined,
        cleanSlPrice || undefined,
      );

      // Also push the updated positions immediately to update the UI
      const currentPositions = streamManager.positions.getCachedData();
      const optimisticallyUpdatedPositions = currentPositions.map((p) =>
        p.symbol === currentPosition.symbol
          ? {
              ...p,
              takeProfitPrice: cleanTpPrice || undefined,
              stopLossPrice: cleanSlPrice || undefined,
            }
          : p,
      );
      streamManager.positions.pushData(optimisticallyUpdatedPositions);

      // Schedule delayed REST refetch as safety net
      // Use pushPositionsWithOverrides so we don't overwrite with stale REST
      // data while the override is still active
      setTimeout(async () => {
        try {
          const freshPositions = await controller.getPositions({
            skipCache: true,
          });
          streamManager.pushPositionsWithOverrides(freshPositions);
        } catch (e) {
          console.warn('[Perps] Delayed refetch failed:', e);
        }
      }, 2500);

      // Success - collapse the card
      setIsAutoCloseExpanded(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      setTpslError(errorMessage);
      console.error('TP/SL update failed:', error);
    } finally {
      setIsSavingTPSL(false);
    }
  }, [isEligible, selectedAddress, editingTpPrice, editingSlPrice]);

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

  // Watch for new position to appear in stream after order placement
  useEffect(() => {
    if (!pendingOrderSymbol) {
      return;
    }

    // Check if position for this symbol now exists
    const hasPosition = allPositions.some(
      (p) => p.symbol === pendingOrderSymbol,
    );

    if (hasPosition) {
      // Position confirmed - clear pending and navigate to detail view
      setPendingOrderSymbol(null);
      setIsSubmitting(false);
      setCurrentView('detail');
      setOrderMode('new');
    }
  }, [pendingOrderSymbol, allPositions]);

  // Fallback timeout: if position doesn't appear within 15 seconds, navigate anyway
  useEffect(() => {
    if (!pendingOrderSymbol) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setPendingOrderSymbol(null);
      setIsSubmitting(false);
      setCurrentView('detail');
      setOrderMode('new');
    }, 15000);

    return () => clearTimeout(timeout);
  }, [pendingOrderSymbol]);

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

  // Determine submit button text based on order mode
  const isLong = orderDirection === 'long';
  const getSubmitButtonText = () => {
    switch (orderMode) {
      case 'modify':
        return t('perpsModifyPosition');
      case 'close':
        return isLong
          ? t('perpsConfirmCloseLong')
          : t('perpsConfirmCloseShort');
      default:
        return isLong
          ? t('perpsOpenLong', [displayName])
          : t('perpsOpenShort', [displayName]);
    }
  };
  const submitButtonText = getSubmitButtonText();

  // Determine header text based on order mode
  const getHeaderText = () => {
    const directionText = isLong ? t('perpsLong') : t('perpsShort');
    switch (orderMode) {
      case 'modify':
        return `${t('perpsModify')} ${directionText} ${displayName}`;
      case 'close':
        return `${t('perpsClose')} ${directionText} ${displayName}`;
      default:
        return `${directionText} ${displayName}`;
    }
  };

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

        {/* Header Content - Different for detail vs order view */}
        {currentView === 'order' ? (
          /* Order View: Show mode + direction + asset name, price + change */
          <Box flexDirection={BoxFlexDirection.Column}>
            {/* Mode + Direction + Asset */}
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
            >
              {getHeaderText()}
            </Text>

            {/* Price and Change Row */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Baseline}
              gap={1}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                data-testid="perps-order-price"
              >
                {displayPrice}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={getChangeColor(displayChange)}
                data-testid="perps-order-change"
              >
                {displayChange}
              </Text>
            </Box>
          </Box>
        ) : (
          /* Detail View: Show symbol-USD, price + change */
          <Box flexDirection={BoxFlexDirection.Column}>
            {/* Symbol */}
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
              {displayName}-USD
            </Text>

            {/* Price and Change Row */}
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
        )}

        {/* Spacer */}
        <Box className="flex-1" />

        {/* Right Side Action - Different for detail vs order view */}
        {currentView === 'order' ? (
          /* Order View: Market/Limit Dropdown */
          <Box className="relative">
            <Box
              data-testid="perps-order-type-dropdown"
              onClick={() =>
                setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)
              }
              className={twMerge(
                'flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer',
                'bg-muted hover:bg-muted-hover',
              )}
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {orderType === 'market' ? t('perpsMarket') : t('perpsLimit')}
              </Text>
              <Icon
                name={IconName.ArrowDown}
                size={IconSize.Xs}
                color={IconColor.IconAlternative}
              />
            </Box>

            {/* Dropdown Menu */}
            {isOrderTypeDropdownOpen && (
              <Box
                className="absolute right-0 top-full mt-1 bg-default border border-muted rounded-lg shadow-lg z-10 min-w-[100px]"
                data-testid="perps-order-type-dropdown-menu"
              >
                <Box
                  onClick={() => {
                    setOrderType('market');
                    setIsOrderTypeDropdownOpen(false);
                  }}
                  className={twMerge(
                    'px-3 py-2 cursor-pointer rounded-t-lg',
                    orderType === 'market'
                      ? 'bg-primary-muted'
                      : 'hover:bg-muted-hover',
                  )}
                  data-testid="perps-order-type-market"
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={
                      orderType === 'market'
                        ? TextColor.PrimaryDefault
                        : TextColor.TextDefault
                    }
                  >
                    {t('perpsMarket')}
                  </Text>
                </Box>
                <Box
                  onClick={() => {
                    setOrderType('limit');
                    setIsOrderTypeDropdownOpen(false);
                  }}
                  className={twMerge(
                    'px-3 py-2 cursor-pointer rounded-b-lg',
                    orderType === 'limit'
                      ? 'bg-primary-muted'
                      : 'hover:bg-muted-hover',
                  )}
                  data-testid="perps-order-type-limit"
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={
                      orderType === 'limit'
                        ? TextColor.PrimaryDefault
                        : TextColor.TextDefault
                    }
                  >
                    {t('perpsLimit')}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          /* Detail View: Favorite Star */
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
        )}
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

      {/* Order Entry View - shown when in order mode */}
      {currentView === 'order' && (
        <Box
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          className={twMerge(
            'flex-1',
            isOrderPending && 'pointer-events-none opacity-50',
          )}
        >
          <OrderEntry
            asset={decodedSymbol}
            currentPrice={currentPrice}
            maxLeverage={maxLeverage}
            availableBalance={availableBalance}
            initialDirection={orderDirection}
            showSubmitButton={false}
            onFormStateChange={handleFormStateChange}
            mode={orderMode}
            orderType={orderType}
            existingPosition={existingPositionForOrder}
            midPrice={topOfBook?.midPrice}
            bidPrice={topOfBook?.bidPrice}
            askPrice={topOfBook?.askPrice}
          />
        </Box>
      )}

      {/* Detail View Content - shown when in detail mode */}
      {currentView === 'detail' && (
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
              <Box
                flexDirection={BoxFlexDirection.Column}
                gap={2}
                paddingTop={2}
              >
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

                  {/* Margin Card */}
                  <Box
                    className="flex-1 cursor-pointer rounded-xl bg-muted px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed"
                    flexDirection={BoxFlexDirection.Column}
                    onClick={handleMarginToggle}
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

                {/* Edit Margin - Expandable (full width) */}
                {position && selectedAddress && (
                  <EditMarginExpandable
                    position={position}
                    account={account}
                    currentPrice={currentPrice}
                    selectedAddress={selectedAddress}
                    isExpanded={isMarginExpanded}
                    onToggle={handleMarginToggle}
                  />
                )}

                {/* Third Row: Auto Close (Full Width) - Expandable */}
                <Box
                  className="rounded-xl bg-muted overflow-hidden"
                  flexDirection={BoxFlexDirection.Column}
                >
                  {/* Header - Always visible, click to toggle */}
                  <Box
                    className={twMerge(
                      'cursor-pointer px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed transition-all duration-200',
                      isAutoCloseExpanded ? 'rounded-t-xl' : 'rounded-xl',
                    )}
                    flexDirection={BoxFlexDirection.Row}
                    justifyContent={BoxJustifyContent.Between}
                    alignItems={BoxAlignItems.Center}
                    onClick={handleAutoCloseToggle}
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
                      name={IconName.ArrowDown}
                      size={IconSize.Sm}
                      color={IconColor.IconAlternative}
                      className={twMerge(
                        'transition-transform duration-300 ease-in-out',
                        isAutoCloseExpanded && 'rotate-180',
                      )}
                    />
                  </Box>

                  {/* Expanded content - TP/SL inputs */}
                  <Box
                    className={twMerge(
                      'grid transition-all duration-300 ease-in-out',
                      isAutoCloseExpanded
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <Box
                      className="overflow-hidden border-t border-muted"
                      flexDirection={BoxFlexDirection.Column}
                    >
                      <Box
                        className="px-4 py-3"
                        flexDirection={BoxFlexDirection.Column}
                        gap={4}
                      >
                        {/* Take Profit Section */}
                        <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                          <Text
                            variant={TextVariant.BodySm}
                            color={TextColor.TextAlternative}
                            fontWeight={FontWeight.Medium}
                          >
                            {t('perpsTakeProfit')}
                          </Text>

                          {/* TP Preset Buttons */}
                          <Box flexDirection={BoxFlexDirection.Row} gap={2}>
                            {TP_PRESETS.map((preset) => (
                              <Box
                                key={`tp-edit-${preset}`}
                                onClick={
                                  isTPSLPending
                                    ? undefined
                                    : () => handleTpPresetClick(preset)
                                }
                                className={twMerge(
                                  'flex-1 py-1.5 rounded-lg bg-muted cursor-pointer',
                                  'hover:bg-hover active:bg-pressed',
                                  'border-0 transition-colors duration-150',
                                  'text-center',
                                  isTPSLPending &&
                                    'opacity-50 cursor-not-allowed pointer-events-none',
                                )}
                              >
                                <Text
                                  variant={TextVariant.BodySm}
                                  color={TextColor.TextAlternative}
                                >
                                  +{preset}%
                                </Text>
                              </Box>
                            ))}
                          </Box>

                          {/* TP Input Row: Price ($) left, Percent (%) right */}
                          <Box
                            flexDirection={BoxFlexDirection.Row}
                            gap={2}
                            alignItems={BoxAlignItems.Center}
                          >
                            {/* TP Price Input */}
                            <Box className="flex-1">
                              <TextField
                                size={TextFieldSize.Md}
                                value={editingTpPrice}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const { value } = e.target;
                                  if (
                                    value === '' ||
                                    /^[\d,]*\.?\d*$/u.test(value)
                                  ) {
                                    setEditingTpPrice(value);
                                  }
                                }}
                                onBlur={handleTpPriceBlur}
                                placeholder="0.00"
                                borderRadius={BorderRadius.MD}
                                borderWidth={0}
                                backgroundColor={
                                  BackgroundColor.backgroundMuted
                                }
                                className="w-full"
                                disabled={isTPSLPending}
                                startAccessory={
                                  <Text
                                    variant={TextVariant.BodyMd}
                                    color={TextColor.TextAlternative}
                                  >
                                    $
                                  </Text>
                                }
                              />
                            </Box>

                            {/* TP Percent Input */}
                            <Box className="flex-1">
                              <TextField
                                size={TextFieldSize.Md}
                                value={editingTpPercent}
                                onChange={handleTpPercentInputChange}
                                placeholder="0.0"
                                borderRadius={BorderRadius.MD}
                                borderWidth={0}
                                backgroundColor={
                                  BackgroundColor.backgroundMuted
                                }
                                className="w-full"
                                disabled={isTPSLPending}
                                endAccessory={
                                  <Text
                                    variant={TextVariant.BodyMd}
                                    color={TextColor.TextAlternative}
                                  >
                                    %
                                  </Text>
                                }
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* Stop Loss Section */}
                        <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                          <Text
                            variant={TextVariant.BodySm}
                            color={TextColor.TextAlternative}
                            fontWeight={FontWeight.Medium}
                          >
                            {t('perpsStopLoss')}
                          </Text>

                          {/* SL Preset Buttons */}
                          <Box flexDirection={BoxFlexDirection.Row} gap={2}>
                            {SL_PRESETS.map((preset) => (
                              <Box
                                key={`sl-edit-${preset}`}
                                onClick={
                                  isTPSLPending
                                    ? undefined
                                    : () => handleSlPresetClick(preset)
                                }
                                className={twMerge(
                                  'flex-1 py-1.5 rounded-lg bg-muted cursor-pointer',
                                  'hover:bg-hover active:bg-pressed',
                                  'border-0 transition-colors duration-150',
                                  'text-center',
                                  isTPSLPending &&
                                    'opacity-50 cursor-not-allowed pointer-events-none',
                                )}
                              >
                                <Text
                                  variant={TextVariant.BodySm}
                                  color={TextColor.TextAlternative}
                                >
                                  -{preset}%
                                </Text>
                              </Box>
                            ))}
                          </Box>

                          {/* SL Input Row: Price ($) left, Percent (%) right */}
                          <Box
                            flexDirection={BoxFlexDirection.Row}
                            gap={2}
                            alignItems={BoxAlignItems.Center}
                          >
                            {/* SL Price Input */}
                            <Box className="flex-1">
                              <TextField
                                size={TextFieldSize.Md}
                                value={editingSlPrice}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  const { value } = e.target;
                                  if (
                                    value === '' ||
                                    /^[\d,]*\.?\d*$/u.test(value)
                                  ) {
                                    setEditingSlPrice(value);
                                  }
                                }}
                                onBlur={handleSlPriceBlur}
                                placeholder="0.00"
                                borderRadius={BorderRadius.MD}
                                borderWidth={0}
                                backgroundColor={
                                  BackgroundColor.backgroundMuted
                                }
                                className="w-full"
                                disabled={isTPSLPending}
                                startAccessory={
                                  <Text
                                    variant={TextVariant.BodyMd}
                                    color={TextColor.TextAlternative}
                                  >
                                    $
                                  </Text>
                                }
                              />
                            </Box>

                            {/* SL Percent Input */}
                            <Box className="flex-1">
                              <TextField
                                size={TextFieldSize.Md}
                                value={editingSlPercent}
                                onChange={handleSlPercentInputChange}
                                placeholder="0.0"
                                borderRadius={BorderRadius.MD}
                                borderWidth={0}
                                backgroundColor={
                                  BackgroundColor.backgroundMuted
                                }
                                className="w-full"
                                disabled={isTPSLPending}
                                endAccessory={
                                  <Text
                                    variant={TextVariant.BodyMd}
                                    color={TextColor.TextAlternative}
                                  >
                                    %
                                  </Text>
                                }
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* Error message */}
                        {tpslError && (
                          <Box
                            className="bg-error-muted rounded-lg"
                            padding={2}
                            flexDirection={BoxFlexDirection.Row}
                            alignItems={BoxAlignItems.Center}
                            gap={2}
                          >
                            <Icon
                              name={IconName.Warning}
                              size={IconSize.Sm}
                              color={IconColor.ErrorDefault}
                            />
                            <Text
                              variant={TextVariant.BodySm}
                              color={TextColor.ErrorDefault}
                            >
                              {tpslError}
                            </Text>
                          </Box>
                        )}

                        {/* Save Button */}
                        <Button
                          variant={ButtonVariant.Primary}
                          size={ButtonSize.Md}
                          onClick={handleSaveTPSL}
                          disabled={!isEligible || isTPSLPending}
                          title={
                            isEligible ? undefined : t('perpsGeoBlockedTooltip')
                          }
                          className={twMerge(
                            'w-full',
                            (isTPSLPending || !isEligible) &&
                              'opacity-70 cursor-not-allowed',
                          )}
                        >
                          {isTPSLPending
                            ? t('perpsSubmitting')
                            : t('perpsSaveChanges')}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
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
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
      )}

      {/* Sticky Footer */}
      <Box
        className="sticky bottom-0 left-0 right-0 bg-default border-t border-muted"
        paddingLeft={4}
        paddingRight={4}
        paddingTop={3}
        paddingBottom={4}
      >
        {/* Order Mode: Show Submit Order button with error display */}
        {currentView === 'order' && (
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            {/* Error message display */}
            {submitError && (
              <Box
                className="bg-error-muted rounded-lg"
                padding={3}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={2}
              >
                <Icon
                  name={IconName.Warning}
                  size={IconSize.Sm}
                  color={IconColor.ErrorDefault}
                />
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.ErrorDefault}
                >
                  {submitError}
                </Text>
              </Box>
            )}
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={handleOrderSubmit}
              disabled={isSubmitDisabled}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
              className={twMerge(
                'w-full',
                isSubmitDisabled && 'opacity-70 cursor-not-allowed',
              )}
              data-testid="submit-order-button"
            >
              {isOrderPending ? t('perpsSubmitting') : submitButtonText}
            </Button>
          </Box>
        )}

        {/* Detail Mode with Position: Show Modify and Close buttons */}
        {currentView !== 'order' && position && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={3}
            data-testid="perps-position-cta-buttons"
          >
            {/* Modify Button - Dark neutral style */}
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={handleModifyPosition}
              disabled={!isEligible}
              title={isEligible ? undefined : t('perpsGeoBlockedTooltip')}
              className="flex-1"
              data-testid="perps-modify-cta-button"
            >
              {t('perpsModify')}
            </Button>

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

        {/* Detail Mode without Position: Show Long and Short buttons */}
        {currentView !== 'order' && !position && (
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
    </Box>
  );
};

export default PerpsMarketDetailPage;
