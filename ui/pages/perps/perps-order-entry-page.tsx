import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
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
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  ORDER_SLIPPAGE_CONFIG,
  PERFORMANCE_CONFIG,
  type ClosePositionParams,
  type OrderType,
  type OrderParams,
  type PriceUpdate,
  type InputMethod,
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
import { usePerpsAttribution } from '../../hooks/perps/usePerpsAttribution';
import { usePerpsMarketInfo } from '../../hooks/perps/usePerpsMarketInfo';
import { usePerpsOrderFees } from '../../hooks/perps/usePerpsOrderFees';
import { getTradeableBalance } from '../../hooks/perps/getTradeableBalance';
import { useFormatters } from '../../hooks/useFormatters';
import { translatePerpsError } from '../../components/app/perps/utils/translate-perps-error';
import { trackPerpsErrorScreenViewed } from '../../components/app/perps/utils/track-perps-error-screen';
import { PerpsGeoBlockModal } from '../../components/app/perps/perps-geo-block-modal';
import { PerpsSlippageConfigModal } from '../../components/app/perps/slippage-config';
import { bpsToPercent } from '../../components/app/perps/constants/slippageConfig';
import { useSelectedAccountComplianceGate } from '../../components/app/compliance';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { getPerpsStreamManager } from '../../providers/perps';
import { submitRequestToBackground } from '../../store/background-connection';
import type { PerpsBackgroundResult } from '../../components/app/perps/types';
import {
  getDisplayName,
  getChangeColor,
  getPositionPnlRatio,
  normalizeTpslPrices,
  safeDecodeURIComponent,
  formatSignedChangePercent,
  willFlipPosition,
  getPositionDirection,
} from '../../components/app/perps/utils';
import { derivePerpsTradeAction } from '../../components/app/perps/utils/deriveTradeAction';
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
import { useVipTier } from '../../hooks/rewards/useVipTier';

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
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { gate } = useSelectedAccountComplianceGate();
  const { isEligible } = usePerpsEligibility();
  const { track } = usePerpsEventTracking();
  const { buildTrackingData, buildTpslTrackingData, setFlowAttribution } =
    usePerpsAttribution();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const orderTypeInteractionSkippedRef = useRef(false);
  const trackRef = useRef(track);
  trackRef.current = track;
  // Last size input method the user used (keypad/percentage/max), attributed on
  // PERPS_TRANSACTION_CONSIDERED. Defaults to 'default' until the
  // user interacts with a size control.
  const lastInputMethodRef = useRef<InputMethod>('default');
  // True once the user has driven a size control (keypad/percentage/max). Used
  // to gate PERPS_TRANSACTION_CONSIDERED so the seeded/default amount and any
  // pre-edit recomputation never count as a user "consideration".
  const hasUserEditedSizeRef = useRef(false);
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

  const DEFAULT_LEVERAGE = 3;

  // Saved trade-configuration defaults surfaced on the trading screen view.
  // `default_payment_token` is intentionally omitted — the Extension
  // trade flow has no pay-with-token selector.
  const tradingScreenDefaults = useMemo(() => {
    const env = isTestnet ? 'testnet' : 'mainnet';
    const config = decodedSymbol
      ? tradeConfigurations[env]?.[decodedSymbol]
      : undefined;
    const pending = config?.pendingConfig;
    // Report the leverage the UI actually seeds, which is clamped to the
    // market max (mirrors `initialLeverage`) — not the raw saved config.
    const marketForSymbol = decodedSymbol
      ? allMarkets.find(
          (m) => m.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
        )
      : undefined;
    const marketMaxLeverage = marketForSymbol
      ? parseInt(marketForSymbol.maxLeverage.replace('x', ''), 10)
      : 50;
    const savedLeverage = config?.leverage ?? DEFAULT_LEVERAGE;
    return {
      [PERPS_EVENT_PROPERTY.SAVED_ORDER]: Boolean(pending),
      [PERPS_EVENT_PROPERTY.DEFAULT_LEVERAGE]: Math.min(
        savedLeverage,
        marketMaxLeverage,
      ),
      ...(pending?.amount
        ? { [PERPS_EVENT_PROPERTY.DEFAULT_SIZE_AMOUNT]: pending.amount }
        : {}),
      [PERPS_EVENT_PROPERTY.DEFAULT_AUTO_CLOSE]: Boolean(
        pending?.takeProfitPrice || pending?.stopLossPrice,
      ),
    };
  }, [tradeConfigurations, isTestnet, decodedSymbol, allMarkets]);

  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: !marketsLoading && Boolean(decodedSymbol) && account !== null,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: PERPS_EVENT_VALUE.SCREEN_TYPE.TRADING,
      ...(decodedSymbol && { [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol }),
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
      [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: hasPerpBalance,
      ...tradingScreenDefaults,
    },
    resetKey: decodedSymbol,
  });

  useEffect(() => {
    setFlowAttribution({
      entryPoint: PERPS_EVENT_VALUE.SOURCE.TRADE_SCREEN,
    });
  }, [setFlowAttribution]);

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
  // 2. Order submission tracking — passed as hlFeeRate on all order types
  //    (new / modify / close).
  const {
    feeRate: currentFeeRate,
    undiscountedFeeRate: currentUndiscountedFeeRate,
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
      currentFeeRate === undefined ||
      currentFeeRate === 0 ||
      currentUndiscountedFeeRate === undefined
    ) {
      return null;
    }
    return (
      orderCalculations.estimatedFees *
      (currentUndiscountedFeeRate / currentFeeRate)
    );
  }, [
    orderCalculations?.estimatedFees,
    currentFeeRate,
    currentUndiscountedFeeRate,
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

  // Market-not-found renders a displayed error state (see the `!market` branch
  // below); emit the error screen view for that funnel state.
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: !marketsLoading && Boolean(decodedSymbol) && !market,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: PERPS_EVENT_VALUE.SCREEN_TYPE.ERROR,
      [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'market_not_found',
      [PERPS_EVENT_PROPERTY.SCREEN_NAME]:
        PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_ORDER,
    },
  });

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
  // Stable primitive for the considered-event effect: only the position
  // DIRECTION (not the live object) affects `action`, so gating on it avoids
  // position-stream churn resetting the debounce when the form is unchanged.
  const positionDirection = position
    ? getPositionDirection(position.size)
    : null;

  // Reset the considered-event gating refs when the market or order context
  // changes, so a prior edit doesn't make the next market's seeded default fire
  // as a user consideration (the page is reused across symbols). `orderDirection`
  // is included because switching Long/Short reseeds usePerpsOrderForm to its
  // default amount — without this reset a prior size edit would let that reseeded
  // default emit CONSIDERED with no new size interaction.
  useEffect(() => {
    hasUserEditedSizeRef.current = false;
    lastInputMethodRef.current = 'default';
  }, [decodedSymbol, orderMode, orderDirection]);

  // Emit PERPS_TRANSACTION_CONSIDERED once the user has a meaningful
  // fill on the open-order screen. Debounced 1s and re-armed on EVERY form
  // change (once the user has edited the size) so it fires once, 1s after the
  // LATEST change, with the latest payload — a non-size change (leverage / TP /
  // SL / order type) reschedules the pending event rather than cancelling it.
  //
  // Gated to avoid over-firing: only the open-order flow (`new`, not modify or
  // close), and only after the user has driven a size control — the `new` form
  // seeds a positive default amount, so `hasUserEditedSizeRef` (set only by
  // AmountInput's user handlers) excludes the seeded default and any pre-edit
  // recomputation. `action` is derived from the existing position direction and
  // the order direction (create / increase / flip), matching the executed tx.
  //
  // Feasible input props ARE included: `input_method` (keypad/slider/
  // percentage/max), reported from AmountInput's per-control handlers (attributed
  // there rather than in usePerpsOrderForm because typing an amount also fires
  // the shared balance-percent sync, which would clobber the method).
  // `limit_price_input_type` / `limit_price_input_preset` are omitted — they
  // require the limit-price control to surface a manual-vs-preset signal it does
  // not expose today (limit-order only). `trade_with_token` is always false: the
  // extension has no
  // pay-with-token selector, so `from_token`/`from_chain` are N/A.
  // PERPS_TRADE_QUOTE_RECEIVED + `quote_latency_ms` are not emitted: the
  // extension has no async pay-with-token relay quote to time (its fee/margin
  // quote is synchronous), and `order_execution_latency_ms` on submitted tx
  // events is controller-owned (deferred to controller 9.2.2).
  useEffect(() => {
    if (
      orderMode !== 'new' ||
      !orderFormState ||
      !hasUserEditedSizeRef.current
    ) {
      return undefined;
    }
    const orderSize = Number.parseFloat(
      orderFormState.amount.replace(/,/gu, ''),
    );
    if (!(orderSize > 0)) {
      return undefined;
    }
    // Derive from the existing position direction + order direction so an
    // opposite-side order against an open position reports a flip, and so this
    // matches the executed-tx `action` (both use derivePerpsTradeAction).
    const action = derivePerpsTradeAction(
      positionDirection,
      orderFormState.direction,
    );
    const timeoutId = setTimeout(() => {
      trackRef.current(MetaMetricsEventName.PerpsTransactionConsidered, {
        [PERPS_EVENT_PROPERTY.ORDER_CONTEXT]: 'trade',
        [PERPS_EVENT_PROPERTY.ACTION]: action,
        [PERPS_EVENT_PROPERTY.ORDER_SIZE]: orderSize,
        [PERPS_EVENT_PROPERTY.ORDER_SIZE_PERCENT]:
          orderFormState.balancePercent,
        [PERPS_EVENT_PROPERTY.INPUT_METHOD]: lastInputMethodRef.current,
        [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
        [PERPS_EVENT_PROPERTY.DIRECTION]:
          orderFormState.direction === 'long'
            ? PERPS_EVENT_VALUE.DIRECTION.LONG
            : PERPS_EVENT_VALUE.DIRECTION.SHORT,
        [PERPS_EVENT_PROPERTY.ORDER_TYPE]: orderFormState.type,
        [PERPS_EVENT_PROPERTY.ORDER_HAS_TP]: Boolean(
          orderFormState.autoCloseEnabled && orderFormState.takeProfitPrice,
        ),
        [PERPS_EVENT_PROPERTY.ORDER_HAS_SL]: Boolean(
          orderFormState.autoCloseEnabled && orderFormState.stopLossPrice,
        ),
        [PERPS_EVENT_PROPERTY.LEVERAGE]: orderFormState.leverage,
        [PERPS_EVENT_PROPERTY.TRADE_WITH_TOKEN]: false,
      });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [orderMode, orderFormState, positionDirection]);

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

    // Subscribe to order book updates from the stream manager
    const streamManager = getPerpsStreamManager();
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
    const displayAssetSymbol = getDisplayName(rawAssetSymbol);
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
      getDisplayName(orderFormState.asset),
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

  // Records the size input method and that the user has edited the size, used to
  // gate + attribute PERPS_TRANSACTION_CONSIDERED.
  const handleInputMethodChange = useCallback((inputMethod: InputMethod) => {
    lastInputMethodRef.current = inputMethod;
    hasUserEditedSizeRef.current = true;
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
      // Slippage limit blocks the order and shows an inline error.
      trackPerpsErrorScreenViewed(
        track,
        PERPS_EVENT_VALUE.ERROR_TYPE.VALIDATION,
        PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_ORDER,
      );
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

    // Controller `{ success: false }` already ran submitted/terminal analytics —
    // surface UI only. Transport throws still use catch + client PerpsError.
    const surfaceControllerFailure = (error: unknown) => {
      if (inProgressToastKey) {
        hidePerpsToast();
      }
      // Every controller-failure / transport-throw path surfaces an error here,
      // so emit the error screen view for all of them.
      trackPerpsErrorScreenViewed(
        track,
        PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_ORDER,
      );
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
        return;
      }
      const failedToastKey = ORDER_MODE_TOAST_KEYS[orderMode].failed;
      const failedToastDescription =
        translatedError ??
        (failedToastKey === PERPS_TOAST_KEYS.ORDER_FAILED
          ? t('perpsToastOrderFailedDescriptionFallback')
          : t('somethingWentWrong'));
      replacePerpsToastByKey({
        key: failedToastKey,
        description: failedToastDescription,
      });
    };

    try {
      if (orderMode === 'close' && position) {
        const closePercentage = closePercent;
        const closeNotionalUsd =
          Math.abs(Number.parseFloat(position.size)) *
          currentPrice *
          (closePercentage / 100);
        const closeEstimatedFees = closeNotionalUsd * (currentFeeRate ?? 0);

        const closeParams = buildClosePositionParams(
          orderFormState,
          currentPrice,
          position.size,
          marketInfo?.szDecimals,
        );
        closeParams.trackingData = buildTrackingData({
          totalFee: closeEstimatedFees,
          marketPrice: currentPrice,
          vipTier,
          vipDiscount: metamaskFeeRateDiscountPercentage,
          hlFeeRate: currentFeeRate,
        });
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsClosePosition',
          [closeParams],
        );
        if (!result.success) {
          surfaceControllerFailure(
            new Error(result.error ?? 'Failed to close position'),
          );
          return;
        }
        // Navigate only on success. Staying on the form on failure lets the
        // catch block surface the inline error (setSubmitError for partial
        // close) and the failure toast renders on the current page.
        handleBackClick();
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
          orderParams.trackingData = buildTrackingData({
            totalFee: orderCalculations?.estimatedFees ?? 0,
            marketPrice: currentPrice,
            vipTier,
            vipDiscount: metamaskFeeRateDiscountPercentage,
            hlFeeRate: currentFeeRate,
            tradeAction: derivePerpsTradeAction(
              position ? getPositionDirection(position.size) : null,
              orderFormState.direction,
            ),
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
            surfaceControllerFailure(
              new Error(result.error ?? 'Failed to add to position'),
            );
            return;
          }
          // Navigate only on success. On failure, stay on the form so the
          // catch block's failure toast renders on the current page.
          handleBackClick();

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
        const positionSize = Math.abs(Number.parseFloat(position.size)) || 0;
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsUpdatePositionTPSL',
          [
            {
              symbol: orderFormState.asset,
              takeProfitPrice,
              stopLossPrice,
              trackingData: buildTpslTrackingData({
                direction:
                  Number.parseFloat(position.size) >= 0 ? 'long' : 'short',
                source: PERPS_EVENT_VALUE.SOURCE.TRADE_SCREEN,
                positionSize,
                isEditingExistingPosition: Boolean(
                  position.takeProfitPrice || position.stopLossPrice,
                ),
              }),
            },
          ],
        );
        if (!result.success) {
          surfaceControllerFailure(
            new Error(result.error ?? 'Failed to update TP/SL'),
          );
          return;
        }
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
      orderParams.trackingData = buildTrackingData({
        totalFee: orderCalculations?.estimatedFees ?? 0,
        marketPrice: currentPrice,
        vipTier,
        vipDiscount: metamaskFeeRateDiscountPercentage,
        hlFeeRate: currentFeeRate,
        tradeAction: derivePerpsTradeAction(
          position ? getPositionDirection(position.size) : null,
          orderFormState.direction,
        ),
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
        surfaceControllerFailure(
          new Error(result.error ?? 'Failed to place order'),
        );
        return;
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
                trackingData: buildTpslTrackingData({
                  direction: orderFormState.direction,
                  source: PERPS_EVENT_VALUE.SOURCE.TRADE_SCREEN,
                  positionSize:
                    Math.abs(Number.parseFloat(orderParams.size)) || 0,
                  // New/flip market attach — not editing an existing TP/SL set.
                  isEditingExistingPosition: false,
                }),
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
          const translatedTpslError = translatePerpsError(
            new Error(tpslMessage),
            t as (key: string) => string,
          );
          replacePerpsToastByKey({
            key: PERPS_TOAST_KEYS.UPDATE_FAILED,
            description: translatedTpslError ?? tpslMessage,
          });
          // TP/SL attach failed after the order filled — surfaced via toast.
          trackPerpsErrorScreenViewed(
            track,
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
            PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_ORDER,
          );
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
      // Transport/background throws never reach the controller trade/close
      // submitted/terminal pipeline — keep client PerpsError for that gap.
      // Controller `{ success: false }` is handled above via surfaceControllerFailure.
      const rawErrorMessage =
        error instanceof Error ? error.message : t('somethingWentWrong');
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: rawErrorMessage,
      });
      surfaceControllerFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isEligible,
    orderFormState,
    orderMode,
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
    currentFeeRate,
    hasPendingPerpsDeposit,
    marketInfo?.szDecimals,
    vipTier,
    metamaskFeeRateDiscountPercentage,
    exceedsMaxSlippage,
    estimatedSlippageBps,
    maxSlippageBps,
    maxSlippageSource,
    isSlippageConfigEnabled,
    buildTrackingData,
    buildTpslTrackingData,
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

  const displayName = getDisplayName(market.symbol);
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
      className="main-container asset__container"
      data-testid="perps-order-entry-page"
      onSubmit={handleFormSubmit}
    >
      {/* Header: Back (left) + Asset symbol, price, % gain (centered) + spacer (right) */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
      >
        <Box
          data-testid="perps-order-entry-back-button"
          onClick={() => handleBackClick()}
          aria-label={t('back')}
          className="w-9 shrink-0 cursor-pointer"
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="flex-1 min-w-0"
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Bold}
            color={TextColor.TextDefault}
            data-testid="perps-order-entry-asset-symbol"
          >
            {displayName}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Baseline}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              data-testid="perps-order-entry-price"
            >
              {displayPrice}
            </Text>
            {displayChange && (
              <Text
                variant={TextVariant.BodySm}
                color={getChangeColor(displayChange)}
                data-testid="perps-order-entry-change"
              >
                {displayChange}
              </Text>
            )}
          </Box>
        </Box>
        <Box className="w-9 shrink-0" aria-hidden="true" />
      </Box>

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
          onInputMethodChange={handleInputMethodChange}
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
