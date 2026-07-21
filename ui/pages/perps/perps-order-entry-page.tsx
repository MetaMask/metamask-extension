import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import type { Json } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import type {
  ClosePositionParams,
  OrderType,
  OrderParams,
  PriceUpdate,
} from '@metamask/perps-controller';
import {
  ORDER_SLIPPAGE_CONFIG,
  PERFORMANCE_CONFIG,
} from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
} from '../../../shared/lib/perps-formatters';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import {
  getIsPerpsExperienceAvailable,
  getIsPerpsOrderBookEnabled,
  getIsPerpsSlippageConfigEnabled,
} from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../helpers/constants/routes';
import {
  usePerpsLivePositions,
  usePerpsLiveAccount,
  usePerpsLiveMarketData,
  usePerpsLiveCandles,
} from '../../hooks/perps/stream';
import {
  selectPerpsDepositPending,
  selectPerpsTradeConfigurations,
  selectPerpsIsTestnet,
  selectPerpsActiveProvider,
} from '../../selectors/perps-controller';
import {
  CandlePeriod,
  TimeDuration,
} from '../../components/app/perps/constants/chartConfig';
import {
  usePerpsEligibility,
  usePerpsEstimatedSlippage,
  usePerpsEventTracking,
  usePerpsMaxSlippage,
} from '../../hooks/perps';
import { usePerpsMarketInfo } from '../../hooks/perps/usePerpsMarketInfo';
import { usePerpsOrderFees } from '../../hooks/perps/usePerpsOrderFees';
import { getTradeableBalance } from '../../hooks/perps/getTradeableBalance';
import { useFormatters } from '../../hooks/useFormatters';
import { translatePerpsError } from '../../components/app/perps/utils/translate-perps-error';
import { PerpsGeoBlockModal } from '../../components/app/perps/perps-geo-block-modal';
import { PerpsSlippageConfigModal } from '../../components/app/perps/slippage-config';
import { bpsToPercent } from '../../components/app/perps/constants/slippageConfig';
import { useSelectedAccountComplianceGate } from '../../components/app/compliance';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { getPerpsStreamManager } from '../../providers/perps';
import { submitRequestToBackground } from '../../store/background-connection';
import type { PerpsBackgroundResult } from '../../components/app/perps/types';
import {
  getDisplaySymbol,
  deriveTpslType,
  getPositionPnlRatio,
  normalizeTpslPrices,
  safeDecodeURIComponent,
  formatSignedChangePercent,
  willFlipPosition,
  buildPerpsVipTrackingData,
} from '../../components/app/perps/utils';
import {
  parsePerpsDisplayPrice,
  formatPerpsFiatMinimal,
  formatPerpsFiatUniversal,
} from '../../components/app/perps/utils/formatPerpsDisplayPrice';
import {
  isLimitPriceUnfavorable as checkLimitPriceUnfavorable,
  isNearLiquidationPrice as checkNearLiquidationPrice,
} from '../../components/app/perps/order-entry/limit-price-warnings';
import {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
  isStopLossSafeFromLiquidation,
} from '../../components/app/perps/utils/tpslValidation';
import { PerpsDetailPageSkeleton } from '../../components/app/perps/perps-skeletons';
import { PERPS_MIN_MARKET_ORDER_USD } from '../../components/app/perps/constants';
import {
  OrderEntry,
  OrderEntryHeader,
  DirectionTabs,
  OrderSummary,
  type OrderDirection,
  type OrderFormState,
  type OrderMode,
  type OrderCalculations,
} from '../../components/app/perps/order-entry';
import {
  PERPS_TOAST_KEYS,
  type PerpsToastKey,
  type PerpsToastRouteState,
  usePerpsToast,
} from '../../components/app/perps/perps-toast';
import { calculatePositionSize } from '../../components/app/perps/order-entry/order-entry.mocks';
import {
  PerpsOrderBook,
  ORDER_BOOK_DEFAULT_WIDTH_PCT,
  ORDER_BOOK_MIN_WIDTH_PCT,
  ORDER_BOOK_MAX_WIDTH_PCT,
  ORDER_BOOK_MIN_WIDTH_PX,
  ORDER_BOOK_FORM_MIN_WIDTH_PX,
  clampOrderBookWidthPct,
  computeOrderBookWidthPct,
} from '../../components/app/perps/order-book';
import { useVipTier } from '../../hooks/rewards/useVipTier';

/** Percentage points the order-book divider moves per arrow-key press. */
const ORDER_BOOK_RESIZE_STEP_PCT = 2;

const ORDER_MODE_TOAST_KEYS: Record<
  OrderMode,
  {
    inProgress?: PerpsToastKey;
    failed: PerpsToastKey;
  }
> = {
  new: {
    inProgress: PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS,
    failed: PERPS_TOAST_KEYS.ORDER_FAILED,
  },
  modify: {
    failed: PERPS_TOAST_KEYS.UPDATE_FAILED,
  },
  close: {
    inProgress: PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS,
    failed: PERPS_TOAST_KEYS.CLOSE_FAILED,
  },
};

export function shouldShowPerpsOrderSubmissionToasts(
  hasPendingPerpsDeposit: boolean,
) {
  return !hasPendingPerpsDeposit;
}

/**
 * Convert UI OrderFormState to PerpsController OrderParams
 *
 * @param formState - Current order form state
 * @param currentPrice - Current asset price in USD
 * @param mode - Order mode (new, modify, close)
 * @param existingPositionSize - Size of existing position when closing
 * @param maxSlippageBps
 */
function formStateToOrderParams(
  formState: OrderFormState,
  currentPrice: number,
  mode: OrderMode,
  existingPositionSize?: string,
  maxSlippageBps?: number,
): OrderParams {
  const isBuy = formState.direction === 'long';
  const marginAmount = Number.parseFloat(formState.amount) || 0;
  const positionSize =
    currentPrice > 0 ? (marginAmount * formState.leverage) / currentPrice : 0;
  const size =
    mode === 'close' && existingPositionSize
      ? Math.abs(Number.parseFloat(existingPositionSize)).toString()
      : positionSize.toString();
  const cleanAmount = formState.amount.replaceAll(',', '');

  const params: OrderParams = {
    symbol: formState.asset,
    isBuy,
    size,
    orderType: formState.type,
    leverage: formState.leverage,
    currentPrice,
    usdAmount: cleanAmount,
    priceAtCalculation: currentPrice,
    maxSlippageBps:
      formState.type === 'limit'
        ? ORDER_SLIPPAGE_CONFIG.DefaultLimitSlippageBps
        : (maxSlippageBps ?? ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps),
  };

  if (formState.type === 'limit' && formState.limitPrice) {
    params.price = formState.limitPrice.replaceAll(',', '');
  }
  if (formState.autoCloseEnabled && formState.takeProfitPrice) {
    params.takeProfitPrice = formState.takeProfitPrice.replaceAll(',', '');
  }
  if (formState.autoCloseEnabled && formState.stopLossPrice) {
    params.stopLossPrice = formState.stopLossPrice.replaceAll(',', '');
  }
  if (mode === 'close') {
    params.reduceOnly = true;
    params.isFullClose = true;
  }

  return params;
}

const FULL_CLOSE_PERCENT = 100;

function buildClosePositionParams(
  formState: OrderFormState,
  currentPrice: number,
  existingPositionSize: string,
  szDecimals?: number,
): ClosePositionParams {
  const closePercent = formState.closePercent ?? FULL_CLOSE_PERCENT;
  const positionSize = Math.abs(Number.parseFloat(existingPositionSize)) || 0;
  const closeNotionalUsd = positionSize * currentPrice * (closePercent / 100);
  const closeSize = calculatePositionSize(
    closeNotionalUsd,
    currentPrice,
    szDecimals,
  ).toString();

  return {
    symbol: formState.asset,
    orderType: 'market',
    currentPrice,
    ...(closePercent >= FULL_CLOSE_PERCENT ? {} : { size: closeSize }),
  };
}

/**
 * PerpsOrderEntryPage - Full-page order entry for perps trading
 * Accessible via /perps/trade/:symbol?direction=long|short&mode=new|modify|close&orderType=market|limit
 */
const PerpsOrderEntryPage = () => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isSlippageConfigEnabled = useSelector(getIsPerpsSlippageConfigEnabled);
  const isOrderBookEnabled = useSelector(getIsPerpsOrderBookEnabled);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { gate } = useSelectedAccountComplianceGate();
  const { isEligible } = usePerpsEligibility();
  const { track } = usePerpsEventTracking();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const [isOrderBookOpen, setIsOrderBookOpen] = useState(false);
  const [orderBookWidthPct, setOrderBookWidthPct] = useState(
    ORDER_BOOK_DEFAULT_WIDTH_PCT,
  );
  const [isResizingOrderBook, setIsResizingOrderBook] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const orderTypeInteractionSkippedRef = useRef(false);
  const trackRef = useRef(track);
  trackRef.current = track;
  const tradeConfigurations = useSelector(selectPerpsTradeConfigurations);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const activeProvider = useSelector(selectPerpsActiveProvider);
  const hasPendingPerpsDeposit = useSelector(selectPerpsDepositPending);
  const { trigger: triggerDeposit, isLoading: isDepositLoading } =
    usePerpsDepositConfirmation();
  const { formatPercentWithMinThreshold } = useFormatters();
  const { replacePerpsToastByKey, hidePerpsToast, setPendingOrder } =
    usePerpsToast();

  const vipTier = useVipTier();

  const { positions: allPositions } = usePerpsLivePositions();
  const { account, isInitialLoading: isLoadingAccount } = usePerpsLiveAccount();
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  const decodedSymbol = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    return safeDecodeURIComponent(symbol);
  }, [symbol]);

  const hasPerpBalance = Boolean(
    account && Number.parseFloat(getTradeableBalance(account)) > 0,
  );

  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: !marketsLoading && Boolean(decodedSymbol) && account !== null,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: PERPS_EVENT_VALUE.SCREEN_TYPE.TRADING,
      ...(decodedSymbol && { [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol }),
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
      [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: hasPerpBalance,
    },
    resetKey: decodedSymbol,
  });

  // Same candle stream as market detail (default 5m) so header price matches chart line.
  const { candleData } = usePerpsLiveCandles({
    symbol: decodedSymbol ?? '',
    interval: CandlePeriod.FiveMinutes,
    duration: TimeDuration.YearToDate,
    throttleMs: 1000,
  });

  const directionParam = searchParams.get('direction');
  const modeParam = searchParams.get('mode');
  const orderTypeParam = searchParams.get('orderType');

  const [orderDirection, setOrderDirection] = useState<OrderDirection>(
    (directionParam === 'short' ? 'short' : 'long') as OrderDirection,
  );
  const [orderType, setOrderType] = useState<OrderType>(
    (orderTypeParam === 'limit' ? 'limit' : 'market') as OrderType,
  );
  // One-shot limit-price prefill from tapping an order-book price row. A fresh
  // object per tap lets the form re-apply the same price after a manual edit.
  const [limitPricePrefill, setLimitPricePrefill] = useState<{
    price: string;
  } | null>(null);
  const [orderMode] = useState<OrderMode>(
    (modeParam === 'modify' || modeParam === 'close'
      ? modeParam
      : 'new') as OrderMode,
  );
  const [orderFormState, setOrderFormState] = useState<OrderFormState | null>(
    null,
  );
  const [orderCalculations, setOrderCalculations] =
    useState<OrderCalculations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSlippageModalOpen, setIsSlippageModalOpen] = useState(false);
  const {
    maxSlippageBps,
    maxSlippageSource,
    setMaxSlippage,
    isLoading: isMaxSlippageLoading,
  } = usePerpsMaxSlippage();

  const isOrderPending = isSubmitting;

  // Dynamic fee rate matching the user-selected order type. Used for both:
  // 1. Reverse-engineering the original (pre-discount) fee from
  //    orderCalculations.estimatedFees (which OrderEntry computes with the
  //    same orderType).
  // 2. Close-mode order submission tracking (close mode defaults to market).
  const {
    feeRate: closeFeeRate,
    undiscountedFeeRate: closeUndiscountedFeeRate,
    protocolFeeRate,
    metamaskFeeRate,
    originalMetamaskFeeRate,
    metamaskFeeRateDiscountPercentage,
  } = usePerpsOrderFees({
    symbol: decodedSymbol ?? '',
    orderType,
  });

  const originalEstimatedFees = useMemo(() => {
    if (
      orderCalculations?.estimatedFees === null ||
      orderCalculations?.estimatedFees === undefined ||
      closeFeeRate === undefined ||
      closeFeeRate === 0 ||
      closeUndiscountedFeeRate === undefined
    ) {
      return null;
    }
    return (
      orderCalculations.estimatedFees *
      (closeUndiscountedFeeRate / closeFeeRate)
    );
  }, [
    orderCalculations?.estimatedFees,
    closeFeeRate,
    closeUndiscountedFeeRate,
  ]);

  const protocolFeeLabel =
    activeProvider === 'hyperliquid'
      ? t('perpsFeesTooltipHyperliquidFee')
      : t('perpsFeesTooltipProviderFee');

  const isLimitPriceInvalid = useMemo(() => {
    if (orderType !== 'limit' || !orderFormState) {
      return false;
    }
    const cleaned = orderFormState.limitPrice?.replaceAll(',', '') ?? '';
    const parsed = Number.parseFloat(cleaned);
    return !cleaned || Number.isNaN(parsed) || parsed <= 0;
  }, [orderType, orderFormState]);

  const market = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return allMarkets.find(
      (m) => m.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [decodedSymbol, allMarkets]);
  const marketInfo = usePerpsMarketInfo(decodedSymbol ?? '');

  useEffect(() => {
    if (!orderTypeInteractionSkippedRef.current) {
      orderTypeInteractionSkippedRef.current = true;
      return;
    }
    trackRef.current(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.ORDER_TYPE_SELECTED,
      [PERPS_EVENT_PROPERTY.SELECTED_ORDER_TYPE]: orderType,
    });
    // Intentionally omit `track`: stable ref avoids spurious events when useAnalytics changes.
  }, [orderType]);

  const position = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return allPositions.find(
      (pos) => pos.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [decodedSymbol, allPositions]);

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
      // Controller not ready
    });

    // Subscribe to price updates from the stream manager
    const streamManager = getPerpsStreamManager();
    const unsubscribe = streamManager.prices.subscribe((priceUpdates) => {
      const update = priceUpdates.find((p) => p.symbol === decodedSymbol);
      if (update) {
        setLivePrice({
          symbol: update.symbol,
          price: update.price,
          timestamp: update.timestamp,
          markPrice: update.markPrice,
          percentChange24h: update.percentChange24h,
          isTradable: update.isTradable,
        });
      }
    });

    return () => {
      submitRequestToBackground('perpsDeactivatePriceStream', []);
      unsubscribe();
    };
  }, [decodedSymbol, selectedAddress]);

  const [topOfBook, setTopOfBook] = useState<{
    midPrice: number;
  } | null>(null);
  useEffect(() => {
    if (!decodedSymbol || !selectedAddress) {
      setTopOfBook(null);
      return undefined;
    }
    // Activate background orderBook stream for this symbol
    submitRequestToBackground('perpsActivateOrderBookStream', [
      {
        symbol: decodedSymbol,
        levels: PERFORMANCE_CONFIG.SlippageEstimateBookLevels,
      },
    ]).catch(() => {
      // Controller not ready
    });

    // Drop any previous symbol's cached order book so late-mounting consumers
    // (e.g. the order-book panel) and the immediate subscribe replay below never
    // render the prior market's book before this symbol's first update arrives.
    // The aggregated channel must be cleared too: the panel unmounts while
    // closed, so on reopen its hook remounts fresh and would otherwise read the
    // previous market's cached aggregated ladder (its reset key does not clear
    // on first mount).
    const streamManager = getPerpsStreamManager();
    streamManager.orderBook.clearCache();
    streamManager.orderBookAggregated.clearCache();

    // Subscribe to order book updates from the stream manager
    const unsubscribe = streamManager.orderBook.subscribe((orderBook) => {
      if (!orderBook) {
        return;
      }
      if (
        orderBook.bids.length > 0 &&
        orderBook.asks.length > 0 &&
        orderBook.midPrice
      ) {
        setTopOfBook({
          midPrice: parseFloat(orderBook.midPrice),
        });
      }
    });

    return () => {
      submitRequestToBackground('perpsDeactivateOrderBookStream', []);
      unsubscribe();
    };
  }, [decodedSymbol, selectedAddress]);

  const marketPrice = useMemo(() => {
    if (!market) {
      return 0;
    }
    return parseFloat(market.price.replace(/[$,]/gu, ''));
  }, [market]);

  const chartCurrentPrice = useMemo(() => {
    if (!candleData?.candles?.length) {
      return 0;
    }
    const lastCandle = candleData.candles.at(-1);
    return lastCandle?.close ? Number.parseFloat(lastCandle.close) : 0;
  }, [candleData]);

  const currentPrice = chartCurrentPrice > 0 ? chartCurrentPrice : marketPrice;

  // Oracle mark price from HyperLiquid's activeAssetCtx feed (oraclePx).
  // This is the price the exchange uses for actual margin assessment and liquidation
  // triggers, so using it here makes the pre-trade margin estimate match mobile.
  // Falls back to currentPrice until the stream delivers its first update.
  const oraclePrice = (() => {
    if (!livePrice?.markPrice) {
      return currentPrice;
    }
    const parsed = parseFloat(livePrice.markPrice);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : currentPrice;
  })();

  // Order-entry surface — use tradeable balance so HyperLiquid unified accounts
  // funded by spot USDC are recognized as tradeable. Withdraw screens still
  // read `account.spendableBalance` directly.
  const availableBalance = Number.parseFloat(getTradeableBalance(account));
  const hasNoAvailableBalance =
    orderMode === 'new' && !isLoadingAccount && availableBalance <= 0;
  const isPrimaryTradeAction = orderMode !== 'new' || !hasNoAvailableBalance;

  const isLimitPriceUnfavorable = useMemo(() => {
    if (orderType !== 'limit' || !orderFormState) {
      return false;
    }
    return checkLimitPriceUnfavorable(
      orderFormState.limitPrice ?? '',
      currentPrice,
      orderDirection,
    );
  }, [orderType, orderFormState, orderDirection, currentPrice]);

  const isNearLiquidation = useMemo(() => {
    if (orderType !== 'limit' || !orderFormState) {
      return false;
    }
    return checkNearLiquidationPrice(
      currentPrice,
      orderCalculations?.liquidationPriceRaw,
      orderDirection,
    );
  }, [
    orderType,
    orderFormState,
    orderDirection,
    currentPrice,
    orderCalculations,
  ]);

  const hasInvalidTPSL = useMemo(() => {
    // In modify mode the TP/SL section is hidden and values carry over untouched,
    // so stale prices that crossed the current market or liquidation price should
    // not block submission. TP/SL edits are validated in the dedicated modal.
    if (!orderFormState?.autoCloseEnabled || orderMode === 'modify') {
      return false;
    }

    const isLimitWithPrice =
      orderType === 'limit' && Boolean(orderFormState.limitPrice?.trim());
    const referencePrice = isLimitWithPrice
      ? Number.parseFloat(orderFormState.limitPrice.replaceAll(/[$,]/gu, ''))
      : currentPrice;

    if (!referencePrice || referencePrice <= 0) {
      return false;
    }

    const tp = orderFormState.takeProfitPrice;
    const sl = orderFormState.stopLossPrice;
    const dir = orderFormState.direction;
    const liquidationPrice = orderCalculations?.liquidationPriceRaw;

    const tpInvalid = Boolean(
      tp?.trim() &&
      !isValidTakeProfitPrice(tp, {
        currentPrice: referencePrice,
        direction: dir,
      }),
    );
    const slInvalid = Boolean(
      sl?.trim() &&
      !isValidStopLossPrice(sl, {
        currentPrice: referencePrice,
        direction: dir,
      }),
    );
    const slLiquidationInvalid = Boolean(
      sl?.trim() &&
      !isStopLossSafeFromLiquidation(sl, {
        liquidationPrice,
        direction: dir,
      }),
    );

    return tpInvalid || slInvalid || slLiquidationInvalid;
  }, [
    orderFormState,
    orderType,
    currentPrice,
    orderMode,
    orderCalculations?.liquidationPriceRaw,
  ]);

  const isInsufficientFunds = useMemo(() => {
    if (!orderFormState || orderMode === 'close') {
      return false;
    }
    const amount =
      Number.parseFloat(orderFormState.amount.replace(/,/gu, '')) || 0;
    if (amount <= 0 || orderFormState.leverage <= 0) {
      return false;
    }
    const marginRequired = amount / orderFormState.leverage;
    return marginRequired > availableBalance;
  }, [orderFormState, orderMode, availableBalance]);

  // For new market orders and modify-with-amount paths, require an amount
  // meeting the $10 market-order minimum so submit stays disabled (and the
  // button advertises the minimum) while the user has not entered a valid
  // size. Modify with empty amount is the TP/SL-only update path and is
  // intentionally exempt — it does not call perpsPlaceOrder.
  const isBelowMinOrderSize = useMemo(() => {
    if (!orderFormState || orderType !== 'market') {
      return false;
    }
    if (orderMode !== 'new' && orderMode !== 'modify') {
      return false;
    }
    const rawAmount = orderFormState.amount.replace(/,/gu, '').trim();
    if (orderMode === 'modify' && rawAmount === '') {
      return false;
    }
    const amount = Number.parseFloat(rawAmount) || 0;
    return amount < PERPS_MIN_MARKET_ORDER_USD;
  }, [orderFormState, orderMode, orderType]);

  const orderUsdAmount = useMemo(() => {
    if (!orderFormState) {
      return 0;
    }
    return Number.parseFloat(orderFormState.amount.replace(/,/gu, '')) || 0;
  }, [orderFormState]);

  const isMarketOrderWithAmount =
    orderType === 'market' &&
    orderUsdAmount > 0 &&
    orderMode !== 'close' &&
    isSlippageConfigEnabled;

  const { estimatedSlippageBps, isReady: isEstimatedSlippageReady } =
    usePerpsEstimatedSlippage({
      symbol: decodedSymbol ?? '',
      sizeUsd: isMarketOrderWithAmount ? orderUsdAmount : undefined,
      isBuy: (orderFormState?.direction ?? orderDirection) === 'long',
      enabled: isMarketOrderWithAmount,
    });

  const estimatedSlippagePct = useMemo(
    () =>
      typeof estimatedSlippageBps === 'number'
        ? bpsToPercent(estimatedSlippageBps)
        : null,
    [estimatedSlippageBps],
  );

  const estimatedSlippagePctDisplay = useMemo(
    () =>
      estimatedSlippagePct === null ? null : estimatedSlippagePct.toFixed(2),
    [estimatedSlippagePct],
  );

  const exceedsMaxSlippage =
    !isMaxSlippageLoading &&
    isMarketOrderWithAmount &&
    isEstimatedSlippageReady &&
    typeof estimatedSlippageBps === 'number' &&
    estimatedSlippageBps > maxSlippageBps;

  const slippageDisplay = useMemo(() => {
    if (
      !isSlippageConfigEnabled ||
      orderType !== 'market' ||
      orderMode === 'close'
    ) {
      return null;
    }
    if (isMaxSlippageLoading) {
      return t('perpsSlippageRowFormatPending', ['--']);
    }
    const maxPct = bpsToPercent(maxSlippageBps);
    if (!isEstimatedSlippageReady || estimatedSlippagePctDisplay === null) {
      return t('perpsSlippageRowFormatPending', [`${maxPct}`]);
    }
    return t('perpsSlippageRowFormat', [
      estimatedSlippagePctDisplay,
      `${maxPct}`,
    ]);
  }, [
    estimatedSlippagePctDisplay,
    isEstimatedSlippageReady,
    isMaxSlippageLoading,
    isSlippageConfigEnabled,
    maxSlippageBps,
    orderMode,
    orderType,
    t,
  ]);

  const slippageTradeProperties = useMemo(
    () => ({
      [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_PCT]: bpsToPercent(maxSlippageBps),
      [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_SOURCE]:
        maxSlippageSource === 'user_configured'
          ? PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.USER_CONFIGURED
          : PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
      ...(estimatedSlippagePct !== null && {
        [PERPS_EVENT_PROPERTY.ESTIMATED_SLIPPAGE_PCT]: estimatedSlippagePct,
      }),
    }),
    [estimatedSlippagePct, maxSlippageBps, maxSlippageSource],
  );

  const isSubmitDisabled =
    !selectedAddress ||
    isDepositLoading ||
    isOrderPending ||
    (orderMode === 'new' && isLoadingAccount) ||
    hasNoAvailableBalance ||
    (isMarketOrderWithAmount &&
      (isMaxSlippageLoading || !isEstimatedSlippageReady)) ||
    (isPrimaryTradeAction &&
      (isLimitPriceInvalid ||
        isLimitPriceUnfavorable ||
        isNearLiquidation ||
        hasInvalidTPSL ||
        isInsufficientFunds ||
        isBelowMinOrderSize ||
        currentPrice <= 0 ||
        (orderMode === 'close' &&
          (orderFormState?.closePercent ?? FULL_CLOSE_PERCENT) <= 0)));

  const maxLeverage = useMemo(() => {
    if (!market) {
      return 50;
    }
    return parseInt(market.maxLeverage.replace('x', ''), 10);
  }, [market]);

  const DEFAULT_LEVERAGE = 3;
  const initialLeverage = useMemo(() => {
    if (!decodedSymbol || orderMode !== 'new') {
      return undefined;
    }
    const env = isTestnet ? 'testnet' : 'mainnet';
    const config = tradeConfigurations[env]?.[decodedSymbol];
    const saved = config?.leverage ?? DEFAULT_LEVERAGE;
    return Math.min(saved, maxLeverage);
  }, [decodedSymbol, orderMode, maxLeverage, tradeConfigurations, isTestnet]);

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

  const displayPrice = useMemo(() => {
    if (chartCurrentPrice > 0) {
      return formatPerpsFiat(chartCurrentPrice, {
        ranges: PRICE_RANGES_UNIVERSAL,
      });
    }
    const liveStreamPrice = Number.parseFloat(livePrice?.price ?? '');
    if (Number.isFinite(liveStreamPrice) && liveStreamPrice > 0) {
      return formatPerpsFiat(liveStreamPrice, {
        ranges: PRICE_RANGES_UNIVERSAL,
      });
    }
    if (market?.price) {
      const parsedMarketPrice = Number.parseFloat(
        market.price.replace(/[$,]/gu, ''),
      );
      if (Number.isFinite(parsedMarketPrice) && parsedMarketPrice > 0) {
        return formatPerpsFiat(parsedMarketPrice, {
          ranges: PRICE_RANGES_UNIVERSAL,
        });
      }
    }
    return '$0.00';
  }, [market?.price, livePrice?.price, chartCurrentPrice]);

  // 24h change prefers live stream updates when available, with market-data fallback.
  const displayChange = formatSignedChangePercent(
    livePrice?.percentChange24h ?? market?.change24hPercent ?? '',
  );

  // Visible header back button: pop the history stack so the user returns to
  // wherever they came from. Pushing marketDetailPath instead would create a
  // market-detail -> order-entry -> market-detail loop, since the
  // market-detail back button uses navigate(-1).
  const navigateBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (decodedSymbol) {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(decodedSymbol)}`,
        { replace: true },
      );
      return;
    }
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [decodedSymbol, navigate]);

  const handleBackClick = useCallback(
    (extraState?: Partial<PerpsToastRouteState>) => {
      if (extraState?.pendingOrderSymbol) {
        setPendingOrder({
          symbol: extraState.pendingOrderSymbol,
          filledDescription: extraState.pendingOrderFilledDescription,
        });
      }
      navigateBack();
    },
    [setPendingOrder, navigateBack],
  );

  const getTradeActionToastDescription = useCallback(() => {
    if (orderMode === 'modify' || !orderFormState) {
      return undefined;
    }

    let directionLabel =
      orderFormState.direction === 'long' ? t('perpsLong') : t('perpsShort');

    if (orderMode === 'close' && position?.size) {
      directionLabel =
        Number.parseFloat(position.size) >= 0
          ? t('perpsLong')
          : t('perpsShort');
    }
    const rawAssetSymbol = orderFormState.asset;
    const displayAssetSymbol = getDisplaySymbol(rawAssetSymbol);
    const formattedPositionSize = orderCalculations?.positionSize?.trim();
    if (!formattedPositionSize) {
      return undefined;
    }

    const rawAmount = formattedPositionSize.endsWith(` ${displayAssetSymbol}`)
      ? formattedPositionSize
          .slice(0, -` ${displayAssetSymbol}`.length)
          .trimEnd()
      : formattedPositionSize;

    if (!rawAmount) {
      return undefined;
    }

    return t('perpsToastOrderPlacementSubtitle', [
      directionLabel,
      rawAmount,
      displayAssetSymbol,
    ]);
  }, [orderCalculations, orderFormState, orderMode, position, t]);

  const getClosePartialToastDescription = useCallback(() => {
    if (orderMode !== 'close' || !orderFormState || !position?.size) {
      return undefined;
    }

    const closePercent = orderFormState.closePercent ?? FULL_CLOSE_PERCENT;
    if (closePercent >= FULL_CLOSE_PERCENT) {
      return undefined;
    }

    const positionSize = Math.abs(Number.parseFloat(position.size));
    if (Number.isNaN(positionSize)) {
      return undefined;
    }

    const closeSize = (positionSize * closePercent) / 100;
    const directionLabel = t(
      Number.parseFloat(position.size) >= 0 ? 'perpsLong' : 'perpsShort',
    );

    return t('perpsToastOrderPlacementSubtitle', [
      directionLabel,
      formatNumber(closeSize, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }),
      getDisplaySymbol(orderFormState.asset),
    ]);
  }, [formatNumber, orderFormState, orderMode, position, t]);

  const getCloseSuccessToastDescription = useCallback(() => {
    if (orderMode !== 'close' || !position) {
      return undefined;
    }

    const pnlRatio = getPositionPnlRatio(position);
    if (pnlRatio === undefined || Number.isNaN(pnlRatio)) {
      return undefined;
    }

    const formattedPnl = formatPercentWithMinThreshold(pnlRatio);
    if (!formattedPnl) {
      return undefined;
    }

    return t('perpsToastClosePnlSubtitle', [formattedPnl]);
  }, [formatPercentWithMinThreshold, orderMode, position, t]);

  const getCloseFailureToastConfig = useCallback(
    (translatedError?: string) => {
      const closePercent = orderFormState?.closePercent ?? FULL_CLOSE_PERCENT;
      const isPartialClose = closePercent < FULL_CLOSE_PERCENT;

      if (isPartialClose) {
        return {
          key: PERPS_TOAST_KEYS.PARTIAL_CLOSE_FAILED,
          // Match mobile toast copy for partial-close failures; detailed errors
          // are shown separately in the page-level submit error.
          description: t('perpsToastPositionStillActive'),
        };
      }

      return {
        key: PERPS_TOAST_KEYS.CLOSE_FAILED,
        description: translatedError ?? t('somethingWentWrong'),
      };
    },
    [orderFormState?.closePercent, t],
  );

  const handleFormStateChange = useCallback((formState: OrderFormState) => {
    setSubmitError(null);
    setOrderFormState(formState);
  }, []);

  const handleCalculationsChange = useCallback(
    (calculations: OrderCalculations) => {
      setOrderCalculations(calculations);
    },
    [],
  );

  const handleDirectionChange = useCallback(
    (direction: OrderDirection) => {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
        [PERPS_EVENT_PROPERTY.DIRECTION]:
          direction === 'long'
            ? PERPS_EVENT_VALUE.DIRECTION.LONG
            : PERPS_EVENT_VALUE.DIRECTION.SHORT,
      });
      setOrderDirection(direction);
    },
    [track],
  );

  // Draggable divider between the order form and the order book panel. Width is
  // tracked as a percentage of the body so the split stays proportional when the
  // window is resized. Clamped so neither side collapses.
  const handleOrderBookResizeStart = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizingOrderBook(true);
  }, []);

  // Window listeners are driven by the resizing state so they are always
  // removed on unmount, when resizing stops, or if the mouseup is missed —
  // attaching them imperatively inside mousedown risks leaking the listeners.
  useEffect(() => {
    if (!isResizingOrderBook) {
      return undefined;
    }
    const handleMove = (moveEvent: MouseEvent) => {
      const container = bodyRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      setOrderBookWidthPct(
        computeOrderBookWidthPct(rect.right, rect.width, moveEvent.clientX),
      );
    };
    const handleUp = () => setIsResizingOrderBook(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizingOrderBook]);

  // Re-clamp the stored width when the body resizes (popup resize / expand to
  // fullscreen). Without this, a width set on a wide body would exceed the
  // pixel-aware maximum on a narrower body and spill the panel off-screen.
  useEffect(() => {
    const container = bodyRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      const { width } = container.getBoundingClientRect();
      setOrderBookWidthPct((pct) => clampOrderBookWidthPct(pct, width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Keyboard resizing for the divider: arrows nudge the split, Home/End jump to
  // the bounds. The order book is right-aligned, so ArrowLeft widens it.
  const handleOrderBookResizeKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const containerWidth = bodyRef.current?.getBoundingClientRect().width;
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setOrderBookWidthPct((width) =>
            clampOrderBookWidthPct(
              width + ORDER_BOOK_RESIZE_STEP_PCT,
              containerWidth,
            ),
          );
          break;
        case 'ArrowRight':
          event.preventDefault();
          setOrderBookWidthPct((width) =>
            clampOrderBookWidthPct(
              width - ORDER_BOOK_RESIZE_STEP_PCT,
              containerWidth,
            ),
          );
          break;
        case 'Home':
          event.preventDefault();
          setOrderBookWidthPct(
            clampOrderBookWidthPct(ORDER_BOOK_MAX_WIDTH_PCT, containerWidth),
          );
          break;
        case 'End':
          event.preventDefault();
          setOrderBookWidthPct(ORDER_BOOK_MIN_WIDTH_PCT);
          break;
        default:
          break;
      }
    },
    [],
  );

  const handleToggleOrderBook = useCallback(() => {
    const next = !isOrderBookOpen;
    setIsOrderBookOpen(next);
    // Tracking is a side effect and must run outside the state updater (updaters
    // must be pure and may be invoked more than once).
    if (next) {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
        ...(decodedSymbol && {
          [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol,
        }),
      });
    } else {
      // Closing unmounts PerpsOrderBook, which resets its in-memory grouping
      // selection back to the default. The aggregated book cache, however,
      // outlives the panel, and usePerpsChannel does not clear it on first
      // mount — so a reopen would render the previous grouping's rows under the
      // reset default label until the next stream update lands. Clear the
      // aggregated cache on close so a reopen starts from a clean slate. This
      // is distinct from the cross-market clear in the order-book stream effect
      // (that one guards against showing the *prior symbol's* book).
      getPerpsStreamManager().orderBookAggregated.clearCache();
    }
  }, [isOrderBookOpen, track, decodedSymbol]);

  // Tapping an order-book price turns the order into a limit order prefilled
  // with that price. Switching the type is a no-op when already on limit.
  const handleOrderBookPriceSelect = useCallback((price: string) => {
    setOrderType('limit');
    setLimitPricePrefill({ price });
  }, []);

  const handleOrderSubmit = useCallback(async () => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    if (!orderFormState || !selectedAddress || currentPrice <= 0) {
      return;
    }

    if (
      isMarketOrderWithAmount &&
      (isMaxSlippageLoading || !isEstimatedSlippageReady)
    ) {
      return;
    }

    if (exceedsMaxSlippage && typeof estimatedSlippageBps === 'number') {
      const estPct = bpsToPercent(estimatedSlippageBps);
      const maxPct = bpsToPercent(maxSlippageBps);
      const message = t('perpsSlippageExceedsMax', [
        estPct.toFixed(2),
        maxPct.toFixed(2),
      ]);
      setSubmitError(message);
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.SLIPPAGE_LIMIT_BLOCKED_ORDER,
        [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
        [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_PCT]: maxPct,
        [PERPS_EVENT_PROPERTY.ESTIMATED_SLIPPAGE_PCT]: estPct,
        [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_SOURCE]:
          maxSlippageSource === 'user_configured'
            ? PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.USER_CONFIGURED
            : PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const tradeActionToastDescription = getTradeActionToastDescription();
    const closePartialToastDescription = getClosePartialToastDescription();
    const closeSuccessToastDescription =
      getCloseSuccessToastDescription() ?? tradeActionToastDescription;
    const closePercent = orderFormState.closePercent ?? FULL_CLOSE_PERCENT;
    const isPartialClose =
      orderMode === 'close' && closePercent < FULL_CLOSE_PERCENT;

    const shouldShowOrderSubmissionToasts =
      shouldShowPerpsOrderSubmissionToasts(hasPendingPerpsDeposit);
    let inProgressToastKey: PerpsToastKey | undefined;
    let inProgressToastDescription: string | undefined;
    if (orderMode === 'close') {
      inProgressToastKey = isPartialClose
        ? PERPS_TOAST_KEYS.PARTIAL_CLOSE_IN_PROGRESS
        : PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS;
      inProgressToastDescription = isPartialClose
        ? closePartialToastDescription
        : tradeActionToastDescription;
    } else {
      inProgressToastKey =
        orderMode === 'new' && !shouldShowOrderSubmissionToasts
          ? undefined
          : ORDER_MODE_TOAST_KEYS[orderMode].inProgress;
      inProgressToastDescription =
        orderMode === 'new' ? tradeActionToastDescription : undefined;
    }
    if (inProgressToastKey) {
      replacePerpsToastByKey({
        key: inProgressToastKey,
        ...(inProgressToastDescription
          ? { description: inProgressToastDescription }
          : {}),
      });
    }

    const deriveTradeAction = (): string => {
      if (!position) {
        return PERPS_EVENT_VALUE.TRADE_ACTION.CREATE_POSITION;
      }
      const posSize = Number.parseFloat(position.size) || 0;
      const posIsLong = posSize >= 0;
      const orderIsLong = orderDirection === 'long';
      if (posIsLong !== orderIsLong) {
        return posIsLong
          ? PERPS_EVENT_VALUE.TRADE_ACTION.FLIP_LONG_TO_SHORT
          : PERPS_EVENT_VALUE.TRADE_ACTION.FLIP_SHORT_TO_LONG;
      }
      return PERPS_EVENT_VALUE.TRADE_ACTION.INCREASE_POSITION;
    };

    let specificFailureTracked = false;
    const reportTransactionFailure = (
      event:
        | typeof MetaMetricsEventName.PerpsTradeTransaction
        | typeof MetaMetricsEventName.PerpsPositionCloseTransaction
        | typeof MetaMetricsEventName.PerpsRiskManagement,
      errorMessage: string,
      extraProperties?: Record<string, Json>,
    ) => {
      specificFailureTracked = true;
      track(event, {
        [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
        [PERPS_EVENT_PROPERTY.FAILURE_REASON]: errorMessage,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
        ...(event === MetaMetricsEventName.PerpsTradeTransaction && {
          [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
          [PERPS_EVENT_PROPERTY.SIZE]: orderFormState.amount,
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
            orderCalculations?.estimatedFees ?? null,
        }),
        ...(event === MetaMetricsEventName.PerpsRiskManagement && {
          [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
          [PERPS_EVENT_PROPERTY.SIZE]: position?.size ?? null,
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
            orderCalculations?.estimatedFees ?? null,
        }),
        ...extraProperties,
      });
    };

    try {
      if (orderMode === 'close' && position) {
        const closePercentage = closePercent;
        const closeNotionalUsd =
          Math.abs(Number.parseFloat(position.size)) *
          currentPrice *
          (closePercentage / 100);
        const closeEstimatedFees = closeNotionalUsd * (closeFeeRate ?? 0);

        const closeParams = buildClosePositionParams(
          orderFormState,
          currentPrice,
          position.size,
          marketInfo?.szDecimals,
        );
        closeParams.trackingData = buildPerpsVipTrackingData({
          totalFee: closeEstimatedFees,
          marketPrice: currentPrice,
          vipTier,
          vipDiscount: metamaskFeeRateDiscountPercentage,
        });
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsClosePosition',
          [closeParams],
        );
        if (!result.success) {
          const message = result.error || 'Failed to close position';
          reportTransactionFailure(
            MetaMetricsEventName.PerpsPositionCloseTransaction,
            message,
            {
              [PERPS_EVENT_PROPERTY.PERCENTAGE_CLOSED]: closePercentage,
              [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
              [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(closeEstimatedFees),
            },
          );
          throw new Error(result.error ?? 'Failed to close position');
        }
        // Navigate only on success. Staying on the form on failure lets the
        // catch block surface the inline error (setSubmitError for partial
        // close) and the failure toast renders on the current page.
        handleBackClick();
        track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
          [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
          [PERPS_EVENT_PROPERTY.PERCENTAGE_CLOSED]: closePercentage,
          [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(closeEstimatedFees),
        });
        replacePerpsToastByKey({
          key: isPartialClose
            ? PERPS_TOAST_KEYS.PARTIAL_CLOSE_SUCCESS
            : PERPS_TOAST_KEYS.TRADE_SUCCESS,
          description: closeSuccessToastDescription,
        });
        return;
      } else if (orderMode === 'modify' && position) {
        const marginAmount =
          Number.parseFloat(orderFormState.amount.replaceAll(',', '')) || 0;

        if (marginAmount > 0) {
          const orderParams = formStateToOrderParams(
            orderFormState,
            currentPrice,
            orderMode,
            position?.size,
            isSlippageConfigEnabled ? maxSlippageBps : undefined,
          );
          orderParams.trackingData = buildPerpsVipTrackingData({
            totalFee: orderCalculations?.estimatedFees ?? 0,
            marketPrice: currentPrice,
            vipTier,
            vipDiscount: metamaskFeeRateDiscountPercentage,
          });
          // Emit the submit-in-progress toast here (not via route state).
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS,
            ...(tradeActionToastDescription
              ? { description: tradeActionToastDescription }
              : {}),
          });
          const result = await submitRequestToBackground<{
            success: boolean;
            error?: string;
          }>('perpsPlaceOrder', [orderParams]);
          if (!result.success) {
            const message = result.error || 'Failed to add to position';
            reportTransactionFailure(
              MetaMetricsEventName.PerpsTradeTransaction,
              message,
            );
            throw new Error(result.error ?? 'Failed to add to position');
          }
          // Navigate only on success. On failure, stay on the form so the
          // catch block's failure toast renders on the current page.
          handleBackClick();

          track(MetaMetricsEventName.PerpsTradeTransaction, {
            [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
            [PERPS_EVENT_PROPERTY.ORDER_TYPE]: orderFormState.type,
            [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
            [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
            [PERPS_EVENT_PROPERTY.SIZE]: orderFormState.amount,
            [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
              orderCalculations?.estimatedFees ?? null,
            ...(isSlippageConfigEnabled ? slippageTradeProperties : {}),
          });

          submitRequestToBackground('perpsSaveTradeConfiguration', [
            orderFormState.asset,
            orderFormState.leverage,
          ]).catch((e) => {
            console.warn('[Perps] Save trade configuration failed:', e);
          });
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.ORDER_PLACED,
            description: tradeActionToastDescription,
          });
          return;
        }

        const { takeProfitPrice, stopLossPrice } = normalizeTpslPrices({
          takeProfitPrice: orderFormState.autoCloseEnabled
            ? orderFormState.takeProfitPrice
            : undefined,
          stopLossPrice: orderFormState.autoCloseEnabled
            ? orderFormState.stopLossPrice
            : undefined,
        });
        // Emit the update-in-progress toast here (not via route state).
        replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.UPDATE_IN_PROGRESS });
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsUpdatePositionTPSL',
          [{ symbol: orderFormState.asset, takeProfitPrice, stopLossPrice }],
        );
        const derivedTpslType = deriveTpslType({
          takeProfitPrice,
          stopLossPrice,
          hasExistingTpsl: Boolean(
            position?.takeProfitPrice || position?.stopLossPrice,
          ),
        });

        if (!result.success) {
          const message = result.error || 'Failed to update TP/SL';
          reportTransactionFailure(
            MetaMetricsEventName.PerpsRiskManagement,
            message,
            { [PERPS_EVENT_PROPERTY.TYPE]: derivedTpslType },
          );
          throw new Error(result.error ?? 'Failed to update TP/SL');
        }
        track(MetaMetricsEventName.PerpsRiskManagement, {
          [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
          [PERPS_EVENT_PROPERTY.TYPE]: derivedTpslType,
          [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
          [PERPS_EVENT_PROPERTY.SIZE]: position.size,
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
            orderCalculations?.estimatedFees ?? null,
        });
        replacePerpsToastByKey({
          key: PERPS_TOAST_KEYS.UPDATE_SUCCESS,
        });
        handleBackClick();
        return;
      }

      const orderParams = formStateToOrderParams(
        orderFormState,
        currentPrice,
        orderMode,
        position?.size,
        isSlippageConfigEnabled ? maxSlippageBps : undefined,
      );
      orderParams.trackingData = buildPerpsVipTrackingData({
        totalFee: orderCalculations?.estimatedFees ?? 0,
        marketPrice: currentPrice,
        vipTier,
        vipDiscount: metamaskFeeRateDiscountPercentage,
      });
      // Do not re-emit SUBMIT_IN_PROGRESS via route state — it was already
      // emitted above by replacePerpsToastByKey. Re-emitting from the
      // market-detail useEffect races with the ORDER_SUBMITTED replace below
      // and can leave the toast stuck at "Submitting your trade".
      //
      // Market orders with TP/SL on a new (or flipping) position route through
      // the two-step flow used by mobile: place the market order without
      // TP/SL, then call `perpsUpdatePositionTPSL` so the controller submits
      // the trigger orders under `grouping: 'positionTpsl'`. Sending TP/SL in
      // the same `placeOrder` call falls back to the controller's
      // `normalTpsl` default, which leaves the resulting trigger orders
      // tagged `isPositionTpsl: false` and breaks the auto-close/orders
      // partition on the market-detail page.
      const shouldHandleTpslSeparately =
        (orderParams.takeProfitPrice || orderParams.stopLossPrice) &&
        orderFormState.type === 'market' &&
        (!position ||
          parseFloat(position.size.replaceAll(',', '')) === 0 ||
          willFlipPosition(position, orderParams));
      const placeOrderParams = shouldHandleTpslSeparately
        ? (() => {
            const stripped = { ...orderParams };
            delete stripped.takeProfitPrice;
            delete stripped.stopLossPrice;
            return stripped;
          })()
        : orderParams;
      const result = await submitRequestToBackground<PerpsBackgroundResult>(
        'perpsPlaceOrder',
        [placeOrderParams],
      );
      if (!result.success) {
        const message = result.error || 'Failed to place order';
        reportTransactionFailure(
          MetaMetricsEventName.PerpsTradeTransaction,
          message,
        );
        throw new Error(result.error ?? 'Failed to place order');
      }
      if (shouldHandleTpslSeparately) {
        const { takeProfitPrice: cleanTp, stopLossPrice: cleanSl } =
          normalizeTpslPrices({
            takeProfitPrice: orderParams.takeProfitPrice,
            stopLossPrice: orderParams.stopLossPrice,
          });
        const tpslResult =
          await submitRequestToBackground<PerpsBackgroundResult>(
            'perpsUpdatePositionTPSL',
            [
              {
                symbol: orderFormState.asset,
                takeProfitPrice: cleanTp,
                stopLossPrice: cleanSl,
              },
            ],
          );
        if (!tpslResult.success) {
          // The market order already filled — treat as "position opened,
          // TP/SL not set": show the TP/SL-specific failure toast and
          // navigate back to the market detail page so the user can attach
          // TP/SL from the open position rather than re-submitting the
          // order form (which would open a duplicate position).
          const tpslMessage =
            tpslResult.error || 'Failed to attach TP/SL to position';
          reportTransactionFailure(
            MetaMetricsEventName.PerpsRiskManagement,
            tpslMessage,
          );
          const translatedTpslError = translatePerpsError(
            new Error(tpslMessage),
            t as (key: string) => string,
          );
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.UPDATE_FAILED,
            description: translatedTpslError ?? tpslMessage,
          });
          handleBackClick();
          return;
        }
      }
      // Navigate only on success. On failure, stay on the form so the catch
      // block's failure toast renders on the current page. Navigating before
      // the await previously unmounted this page and orphaned the Promise
      // response, leaving the "Submitting your trade" toast stuck forever.
      handleBackClick(
        orderFormState.type === 'market'
          ? {
              pendingOrderSymbol: orderFormState.asset,
              pendingOrderFilledDescription: tradeActionToastDescription,
            }
          : undefined,
      );

      track(MetaMetricsEventName.PerpsTradeTransaction, {
        [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
        [PERPS_EVENT_PROPERTY.ORDER_TYPE]: orderFormState.type,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
        [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
        [PERPS_EVENT_PROPERTY.SIZE]: orderFormState.amount,
        [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
          orderCalculations?.estimatedFees ?? null,
        ...(isSlippageConfigEnabled ? slippageTradeProperties : {}),
      });

      submitRequestToBackground('perpsSaveTradeConfiguration', [
        orderFormState.asset,
        orderFormState.leverage,
      ]).catch((e) => {
        console.warn('[Perps] Save trade configuration failed:', e);
      });

      if (shouldShowOrderSubmissionToasts) {
        replacePerpsToastByKey({
          key:
            orderFormState.type === 'limit'
              ? PERPS_TOAST_KEYS.ORDER_PLACED
              : PERPS_TOAST_KEYS.ORDER_SUBMITTED,
          description: tradeActionToastDescription,
          autoHideTime: 3000,
        });
      }
    } catch (error) {
      if (inProgressToastKey) {
        hidePerpsToast();
      }
      const failedToastKey = ORDER_MODE_TOAST_KEYS[orderMode].failed;
      const translatedError = translatePerpsError(
        error,
        t as (key: string) => string,
      );
      if (orderMode === 'close') {
        if (isPartialClose) {
          setSubmitError(translatedError ?? t('somethingWentWrong'));
        }
        replacePerpsToastByKey(
          getCloseFailureToastConfig(translatedError ?? undefined),
        );
      } else {
        const failedToastDescription =
          translatedError ??
          (failedToastKey === PERPS_TOAST_KEYS.ORDER_FAILED
            ? t('perpsToastOrderFailedDescriptionFallback')
            : t('somethingWentWrong'));

        replacePerpsToastByKey({
          key: failedToastKey,
          description: failedToastDescription,
        });
      }
      if (!specificFailureTracked) {
        const errMsg =
          error instanceof Error ? error.message : 'An unknown error occurred';
        track(MetaMetricsEventName.PerpsError, {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errMsg,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isEligible,
    orderFormState,
    orderMode,
    orderDirection,
    orderCalculations,
    position,
    selectedAddress,
    currentPrice,
    getTradeActionToastDescription,
    getClosePartialToastDescription,
    getCloseSuccessToastDescription,
    getCloseFailureToastConfig,
    handleBackClick,
    track,
    hidePerpsToast,
    replacePerpsToastByKey,
    t,
    closeFeeRate,
    hasPendingPerpsDeposit,
    marketInfo?.szDecimals,
    vipTier,
    metamaskFeeRateDiscountPercentage,
    exceedsMaxSlippage,
    estimatedSlippageBps,
    maxSlippageBps,
    maxSlippageSource,
    isSlippageConfigEnabled,
    slippageTradeProperties,
    isMarketOrderWithAmount,
    isMaxSlippageLoading,
    isEstimatedSlippageReady,
  ]);

  const handlePrimaryAction = useCallback(async () => {
    await gate(async () => {
      if (hasNoAvailableBalance) {
        if (!isEligible) {
          setIsGeoBlockModalOpen(true);
          return;
        }
        if (!selectedAddress || isDepositLoading) {
          return;
        }

        await triggerDeposit();
        return;
      }

      await handleOrderSubmit();
    });
  }, [
    gate,
    handleOrderSubmit,
    hasNoAvailableBalance,
    isDepositLoading,
    isEligible,
    selectedAddress,
    triggerDeposit,
  ]);

  const handleAddFunds = useCallback(async () => {
    await gate(async () => {
      if (!isEligible) {
        setIsGeoBlockModalOpen(true);
        return;
      }
      if (!selectedAddress || isDepositLoading) {
        return;
      }

      await triggerDeposit();
    });
  }, [gate, isDepositLoading, isEligible, selectedAddress, triggerDeposit]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitDisabled) {
        return;
      }
      handlePrimaryAction().catch(() => {
        // Errors are surfaced via the page's submit-error state / toast system.
      });
    },
    [handlePrimaryAction, isSubmitDisabled],
  );

  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }
  if (!symbol || !decodedSymbol) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }
  if (marketsLoading) {
    return <PerpsDetailPageSkeleton />;
  }
  if (!market) {
    return (
      <Box className="main-container asset__container">
        <Box paddingLeft={2} paddingBottom={4} paddingTop={4}>
          <Box
            data-testid="perps-order-entry-back-button"
            onClick={() => handleBackClick()}
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
        </Box>
      </Box>
    );
  }

  const displayName = getDisplaySymbol(market.symbol);
  const isLong = orderDirection === 'long';
  const submitButtonText = (() => {
    if (hasNoAvailableBalance) {
      return t('addFunds');
    }

    switch (orderMode) {
      case 'modify':
        return t('perpsModifyPosition');
      case 'close':
        return t('perpsClosePosition');
      default:
        return isLong
          ? t('perpsOpenLong', [displayName])
          : t('perpsOpenShort', [displayName]);
    }
  })();

  let resolvedButtonText = submitButtonText;
  if (isPrimaryTradeAction) {
    if (isBelowMinOrderSize) {
      resolvedButtonText = t('perpsMinOrderSize', [
        `$${PERPS_MIN_MARKET_ORDER_USD}`,
      ]);
    } else if (isInsufficientFunds) {
      resolvedButtonText = t('insufficientFundsSend');
    }
  }

  return (
    <form
      className="main-container asset__container relative overflow-hidden"
      data-testid="perps-order-entry-page"
      onSubmit={handleFormSubmit}
    >
      <OrderEntryHeader
        displayName={displayName}
        displayPrice={displayPrice}
        displayChange={displayChange}
        onBack={() => handleBackClick()}
        rightAccessory={
          isOrderBookEnabled ? (
            <button
              type="button"
              data-testid="perps-order-book-toggle"
              onClick={handleToggleOrderBook}
              aria-label={t('perpsOrderBook')}
              aria-pressed={isOrderBookOpen}
              className={twMerge(
                'flex items-center justify-center w-9 h-9 shrink-0 cursor-pointer rounded-lg border border-transparent bg-transparent',
                isOrderBookOpen && 'bg-muted border-primary-default',
              )}
            >
              <Icon
                name={IconName.Book}
                size={IconSize.Lg}
                className={
                  isOrderBookOpen ? 'text-default' : 'text-alternative'
                }
              />
            </button>
          ) : undefined
        }
      />

      {/* Body: form content (left) + sliding order book (right). Scrolls
          horizontally as a fallback when a narrow popup cannot fit both
          pixel-floored panes. */}
      <div
        ref={bodyRef}
        className="flex flex-row flex-1 min-h-0 w-full overflow-x-auto"
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          style={{
            minWidth: isOrderBookOpen
              ? ORDER_BOOK_FORM_MIN_WIDTH_PX
              : undefined,
          }}
          className="flex-1 min-w-0 h-full overflow-hidden"
        >
          {/* Scrollable form */}
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className={twMerge(
              'flex-1 overflow-y-auto overflow-x-hidden',
              isOrderPending && 'pointer-events-none opacity-50',
            )}
          >
            {orderMode === 'new' && (
              <DirectionTabs
                direction={orderDirection}
                onDirectionChange={handleDirectionChange}
              />
            )}
            <OrderEntry
              asset={decodedSymbol}
              currentPrice={currentPrice}
              markPrice={oraclePrice}
              maxLeverage={maxLeverage}
              availableBalance={availableBalance}
              initialDirection={orderDirection}
              showSubmitButton={false}
              showOrderSummary={false}
              onFormStateChange={handleFormStateChange}
              onCalculationsChange={handleCalculationsChange}
              mode={orderMode}
              orderType={orderType}
              existingPosition={existingPositionForOrder}
              midPrice={topOfBook?.midPrice}
              onOrderTypeChange={setOrderType}
              onAddFunds={handleAddFunds}
              initialLeverage={initialLeverage}
              autoFocusUsd={orderMode !== 'close'}
              autoFocusLimitPrice={orderMode !== 'close'}
              sizeDecimals={marketInfo?.szDecimals}
              limitPricePrefill={limitPricePrefill ?? undefined}
            />
          </Box>

          {/* Sticky bottom: summary + button */}
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
            paddingTop={3}
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className="shrink-0"
          >
            {orderCalculations && (
              <OrderSummary
                marginRequired={orderCalculations.marginRequired}
                estimatedFees={orderCalculations.estimatedFees}
                originalEstimatedFees={originalEstimatedFees}
                liquidationPrice={orderCalculations.liquidationPrice}
                metamaskFeeRateDiscountPercentage={
                  metamaskFeeRateDiscountPercentage
                }
                metamaskFeeRate={metamaskFeeRate}
                originalMetamaskFeeRate={originalMetamaskFeeRate}
                protocolFeeRate={protocolFeeRate}
                protocolFeeLabel={protocolFeeLabel}
                showSlippageRow={
                  isSlippageConfigEnabled &&
                  orderType === 'market' &&
                  orderMode !== 'close'
                }
                slippageDisplay={slippageDisplay}
                exceedsMaxSlippage={exceedsMaxSlippage}
                isSlippageRowDisabled={isMaxSlippageLoading}
                onSlippageClick={() => {
                  if (isMaxSlippageLoading) {
                    return;
                  }
                  setIsSlippageModalOpen(true);
                  track(MetaMetricsEventName.PerpsUiInteraction, {
                    [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
                      PERPS_EVENT_VALUE.INTERACTION_TYPE.SLIPPAGE_CONFIG_OPENED,
                    [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol,
                    [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_PCT]:
                      bpsToPercent(maxSlippageBps),
                    [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_SOURCE]:
                      maxSlippageSource === 'user_configured'
                        ? PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.USER_CONFIGURED
                        : PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
                  });
                }}
              />
            )}
            {submitError && (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.ErrorDefault}
                data-testid="perps-order-submit-error"
              >
                {submitError}
              </Text>
            )}
            <Button
              type="submit"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              disabled={isSubmitDisabled}
              className={twMerge(
                'w-full',
                isSubmitDisabled && 'opacity-70 cursor-not-allowed',
              )}
              data-testid="submit-order-button"
            >
              {isOrderPending ? t('perpsSubmitting') : resolvedButtonText}
            </Button>
          </Box>
        </Box>
        {/* Draggable divider: resize the order book / form split. */}
        {isOrderBookEnabled && isOrderBookOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('perpsOrderBookResize')}
            aria-valuenow={Math.round(orderBookWidthPct)}
            aria-valuemin={ORDER_BOOK_MIN_WIDTH_PCT}
            aria-valuemax={ORDER_BOOK_MAX_WIDTH_PCT}
            tabIndex={0}
            onMouseDown={handleOrderBookResizeStart}
            onKeyDown={handleOrderBookResizeKeyDown}
            className="w-0.5 shrink-0 cursor-col-resize bg-muted hover:bg-primary-default active:bg-primary-default"
            data-testid="perps-order-book-resize-handle"
          />
        )}
        {/* Order book: slides in from the right, resizable via the divider. It
            is unmounted while collapsed so its focusable controls never sit in
            a zero-width, hidden panel. */}
        {isOrderBookEnabled && (
          <Box
            flexDirection={BoxFlexDirection.Column}
            style={{
              width: isOrderBookOpen ? `${orderBookWidthPct}%` : '0%',
              // Floor the width while open, and use a transitionable 0 (not
              // `undefined`/`auto`) while closed: CSS cannot interpolate
              // `auto -> 140px`, so an `undefined` closed value made the panel
              // snap to full width on open instead of animating. Animating
              // min-width 0 <-> 140px keeps open and close symmetric.
              minWidth: isOrderBookOpen ? ORDER_BOOK_MIN_WIDTH_PX : 0,
            }}
            className={twMerge(
              'shrink-0 h-full overflow-hidden',
              !isResizingOrderBook && 'transition-all duration-300 ease-in-out',
            )}
          >
            {isOrderBookOpen && (
              <PerpsOrderBook
                symbol={decodedSymbol}
                isOpen={isOrderBookOpen}
                marketPrice={currentPrice}
                szDecimals={marketInfo?.szDecimals}
                onSelectPrice={handleOrderBookPriceSelect}
              />
            )}
          </Box>
        )}
      </div>
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
      {isSlippageConfigEnabled && (
        <PerpsSlippageConfigModal
          isOpen={isSlippageModalOpen && !isMaxSlippageLoading}
          currentValueBps={maxSlippageBps}
          onClose={() => setIsSlippageModalOpen(false)}
          onSave={(valueBps) =>
            setMaxSlippage(valueBps)
              .then(() => {
                const savedCapStillExceeded =
                  isEstimatedSlippageReady &&
                  typeof estimatedSlippageBps === 'number' &&
                  estimatedSlippageBps > valueBps;
                if (!savedCapStillExceeded) {
                  setSubmitError(null);
                }
                track(MetaMetricsEventName.PerpsUiInteraction, {
                  [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
                    PERPS_EVENT_VALUE.INTERACTION_TYPE.SLIPPAGE_CONFIG_CHANGED,
                  [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol,
                  [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_PCT]:
                    bpsToPercent(valueBps),
                  [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_SOURCE]:
                    PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.USER_CONFIGURED,
                  [PERPS_EVENT_PROPERTY.SETTING_TYPE]:
                    PERPS_EVENT_VALUE.SETTING_TYPE.SLIPPAGE,
                });
              })
              .catch((error) => {
                setSubmitError(t('somethingWentWrong'));
                throw error;
              })
          }
        />
      )}
    </form>
  );
};

export default PerpsOrderEntryPage;
