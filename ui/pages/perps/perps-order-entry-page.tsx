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
  FontWeight,
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
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../selectors/accounts';
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
  selectPerpsTradeConfigurations,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';
import {
  CandlePeriod,
  TimeDuration,
} from '../../components/app/perps/constants/chartConfig';
import { usePerpsEligibility, usePerpsEventTracking } from '../../hooks/perps';
import { usePerpsMarketInfo } from '../../hooks/perps/usePerpsMarketInfo';
import { usePerpsOrderFees } from '../../hooks/perps/usePerpsOrderFees';
import { useFormatters } from '../../hooks/useFormatters';
import { translatePerpsError } from '../../components/app/perps/utils/translate-perps-error';
import { PerpsGeoBlockModal } from '../../components/app/perps/perps-geo-block-modal';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { getPerpsStreamManager } from '../../providers/perps';
import { submitRequestToBackground } from '../../store/background-connection';
import type { PerpsBackgroundResult } from '../../components/app/perps/types';
import {
  getDisplayName,
  deriveTpslType,
  getChangeColor,
  getPositionPnlRatio,
  normalizeTpslPrices,
  safeDecodeURIComponent,
  formatChangePercent,
} from '../../components/app/perps/utils';
import {
  isLimitPriceUnfavorable as checkLimitPriceUnfavorable,
  isNearLiquidationPrice as checkNearLiquidationPrice,
} from '../../components/app/perps/order-entry/limit-price-warnings';
import {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
} from '../../components/app/perps/utils/tpslValidation';
import { PerpsDetailPageSkeleton } from '../../components/app/perps/perps-skeletons';
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

/**
 * Convert UI OrderFormState to PerpsController OrderParams
 *
 * @param formState - Current order form state
 * @param currentPrice - Current asset price in USD
 * @param mode - Order mode (new, modify, close)
 * @param existingPositionSize - Size of existing position when closing
 */
function formStateToOrderParams(
  formState: OrderFormState,
  currentPrice: number,
  mode: OrderMode,
  existingPositionSize?: string,
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
const PerpsOrderEntryPage: React.FC = () => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { isEligible } = usePerpsEligibility();
  const { track } = usePerpsEventTracking();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const orderTypeInteractionSkippedRef = useRef(false);
  const trackRef = useRef(track);
  trackRef.current = track;
  const tradeConfigurations = useSelector(selectPerpsTradeConfigurations);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const { trigger: triggerDeposit, isLoading: isDepositLoading } =
    usePerpsDepositConfirmation();
  const { formatPercentWithMinThreshold } = useFormatters();
  const { replacePerpsToastByKey, hidePerpsToast } = usePerpsToast();

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

  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: !marketsLoading && Boolean(decodedSymbol) && account !== null,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: PERPS_EVENT_VALUE.SCREEN_TYPE.TRADING,
      ...(decodedSymbol && { [PERPS_EVENT_PROPERTY.ASSET]: decodedSymbol }),
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
      [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]:
        account && Number.parseFloat(account.availableBalance) > 0
          ? 'yes'
          : 'no',
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
  const [pendingOrderSymbol, setPendingOrderSymbol] = useState<string | null>(
    null,
  );
  const [pendingOrderToastDescription, setPendingOrderToastDescription] =
    useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOrderPending = isSubmitting || pendingOrderSymbol !== null;

  // Dynamic fee rate for close-mode order submission tracking
  const { feeRate: closeFeeRate } = usePerpsOrderFees({
    symbol: decodedSymbol ?? '',
    orderType: 'market',
  });

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
    // Intentionally omit `track`: stable ref avoids spurious events when MetaMetricsContext changes.
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
        const {
          timestamp: ts,
          markPrice: mark,
          percentChange24h,
        } = update as {
          timestamp?: number;
          markPrice?: string;
          percentChange24h?: string;
        };
        setLivePrice({
          symbol: update.symbol,
          price: update.price,
          timestamp: ts ?? Date.now(),
          markPrice: mark,
          percentChange24h,
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
      { symbol: decodedSymbol },
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

  const availableBalance = account
    ? Number.parseFloat(account.availableBalance)
    : 0;
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
    if (!orderFormState?.autoCloseEnabled) {
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

    return tpInvalid || slInvalid;
  }, [orderFormState, orderType, currentPrice]);

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

  const isSubmitDisabled =
    !selectedAddress ||
    isDepositLoading ||
    isOrderPending ||
    (orderMode === 'new' && isLoadingAccount) ||
    (isPrimaryTradeAction &&
      (isLimitPriceInvalid ||
        isLimitPriceUnfavorable ||
        isNearLiquidation ||
        hasInvalidTPSL ||
        isInsufficientFunds ||
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
      return `$${formatNumber(chartCurrentPrice, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return market?.price ?? '$0.00';
  }, [chartCurrentPrice, market?.price, formatNumber]);

  // 24h change prefers live stream updates when available, with market-data fallback.
  const displayChange = formatChangePercent(
    livePrice?.percentChange24h ?? market?.change24hPercent ?? '',
  );

  const handleBackClick = useCallback(
    (perpsToastKey?: PerpsToastKey, perpsToastDescription?: string) => {
      if (!decodedSymbol) {
        return;
      }

      const marketDetailPath = `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(
        decodedSymbol,
      )}`;

      if (!perpsToastKey) {
        navigate(marketDetailPath);
        return;
      }

      const toastRouteState: PerpsToastRouteState = {
        perpsToastKey,
        ...(perpsToastDescription ? { perpsToastDescription } : {}),
      };
      navigate(marketDetailPath, { state: toastRouteState });
    },
    [navigate, decodedSymbol],
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

    const rawAmount = formattedPositionSize.endsWith(` ${rawAssetSymbol}`)
      ? formattedPositionSize.slice(0, -` ${rawAssetSymbol}`.length).trimEnd()
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

    setIsSubmitting(true);
    setPendingOrderToastDescription(null);
    setSubmitError(null);

    const tradeActionToastDescription = getTradeActionToastDescription();
    const closePartialToastDescription = getClosePartialToastDescription();
    const closeSuccessToastDescription =
      getCloseSuccessToastDescription() ?? tradeActionToastDescription;
    const closePercent = orderFormState.closePercent ?? FULL_CLOSE_PERCENT;
    const isPartialClose =
      orderMode === 'close' && closePercent < FULL_CLOSE_PERCENT;

    let inProgressToastKey = ORDER_MODE_TOAST_KEYS[orderMode].inProgress;
    let inProgressToastDescription: string | undefined;

    if (orderMode === 'close') {
      inProgressToastKey = isPartialClose
        ? PERPS_TOAST_KEYS.PARTIAL_CLOSE_IN_PROGRESS
        : PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS;
      inProgressToastDescription = isPartialClose
        ? closePartialToastDescription
        : tradeActionToastDescription;
    }
    if (inProgressToastKey !== undefined) {
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
        track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
          [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
          [PERPS_EVENT_PROPERTY.PERCENTAGE_CLOSED]: closePercentage,
          [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(closeEstimatedFees),
        });
        handleBackClick(
          isPartialClose
            ? PERPS_TOAST_KEYS.PARTIAL_CLOSE_SUCCESS
            : PERPS_TOAST_KEYS.TRADE_SUCCESS,
          closeSuccessToastDescription,
        );
        return;
      } else if (orderMode === 'modify' && position) {
        const marginAmount =
          Number.parseFloat(orderFormState.amount.replaceAll(',', '')) || 0;

        if (marginAmount > 0) {
          // Add to position: place order with additional size + TP/SL
          const orderParams = formStateToOrderParams(
            orderFormState,
            currentPrice,
            orderMode,
            position?.size,
          );
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

          track(MetaMetricsEventName.PerpsTradeTransaction, {
            [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
            [PERPS_EVENT_PROPERTY.ORDER_TYPE]: orderFormState.type,
            [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
            [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
            [PERPS_EVENT_PROPERTY.SIZE]: orderFormState.amount,
            [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
              orderCalculations?.estimatedFees ?? null,
          });

          submitRequestToBackground('perpsSaveTradeConfiguration', [
            orderFormState.asset,
            orderFormState.leverage,
          ]).catch((e) => {
            console.warn('[Perps] Save trade configuration failed:', e);
          });

          // Existing position is already in `allPositions`, so pending-order
          // confirmation would resolve immediately; navigate like limit orders.
          handleBackClick(
            PERPS_TOAST_KEYS.ORDER_PLACED,
            tradeActionToastDescription,
          );
          return;
        }

        // Amount is 0: only update TP/SL
        const { takeProfitPrice, stopLossPrice } = normalizeTpslPrices({
          takeProfitPrice: orderFormState.autoCloseEnabled
            ? orderFormState.takeProfitPrice
            : undefined,
          stopLossPrice: orderFormState.autoCloseEnabled
            ? orderFormState.stopLossPrice
            : undefined,
        });
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
        handleBackClick(PERPS_TOAST_KEYS.UPDATE_SUCCESS);
        return;
      }

      const orderParams = formStateToOrderParams(
        orderFormState,
        currentPrice,
        orderMode,
        position?.size,
      );
      const result = await submitRequestToBackground<PerpsBackgroundResult>(
        'perpsPlaceOrder',
        [orderParams],
      );
      if (!result.success) {
        const message = result.error || 'Failed to place order';
        reportTransactionFailure(
          MetaMetricsEventName.PerpsTradeTransaction,
          message,
        );
        throw new Error(result.error ?? 'Failed to place order');
      }

      track(MetaMetricsEventName.PerpsTradeTransaction, {
        [PERPS_EVENT_PROPERTY.ASSET]: orderFormState.asset,
        [PERPS_EVENT_PROPERTY.ORDER_TYPE]: orderFormState.type,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
        [PERPS_EVENT_PROPERTY.ACTION]: deriveTradeAction(),
        [PERPS_EVENT_PROPERTY.SIZE]: orderFormState.amount,
        [PERPS_EVENT_PROPERTY.METAMASK_FEE]:
          orderCalculations?.estimatedFees ?? null,
      });

      submitRequestToBackground('perpsSaveTradeConfiguration', [
        orderFormState.asset,
        orderFormState.leverage,
      ]).catch((e) => {
        console.warn('[Perps] Save trade configuration failed:', e);
      });

      if (orderFormState.type === 'limit') {
        handleBackClick(
          PERPS_TOAST_KEYS.ORDER_PLACED,
          tradeActionToastDescription,
        );
        return;
      }
      setPendingOrderToastDescription(tradeActionToastDescription ?? null);
      setPendingOrderSymbol(orderFormState.asset);
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
    marketInfo?.szDecimals,
  ]);

  const handlePrimaryAction = useCallback(async () => {
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
  }, [
    handleOrderSubmit,
    hasNoAvailableBalance,
    isDepositLoading,
    isEligible,
    selectedAddress,
    triggerDeposit,
  ]);

  useEffect(() => {
    if (!pendingOrderSymbol) {
      return;
    }
    const hasPosition = allPositions.some(
      (p) => p.symbol === pendingOrderSymbol,
    );
    if (hasPosition) {
      setPendingOrderSymbol(null);
      const toastDescription = pendingOrderToastDescription ?? undefined;
      setPendingOrderToastDescription(null);
      setIsSubmitting(false);
      handleBackClick(PERPS_TOAST_KEYS.ORDER_FILLED, toastDescription);
    }
  }, [
    pendingOrderSymbol,
    allPositions,
    handleBackClick,
    pendingOrderToastDescription,
  ]);

  useEffect(() => {
    if (!pendingOrderSymbol) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setPendingOrderSymbol(null);
      setPendingOrderToastDescription(null);
      setIsSubmitting(false);
      hidePerpsToast();
      handleBackClick();
    }, 15000);
    return () => clearTimeout(timeout);
  }, [pendingOrderSymbol, handleBackClick, hidePerpsToast]);

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

  const resolvedButtonText =
    isPrimaryTradeAction && isInsufficientFunds
      ? t('insufficientFundsSend')
      : submitButtonText;

  return (
    <Box
      className="main-container asset__container"
      data-testid="perps-order-entry-page"
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
                variant={TextVariant.BodyXs}
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
        <DirectionTabs
          direction={orderDirection}
          onDirectionChange={handleDirectionChange}
        />
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
          onAddFunds={triggerDeposit}
          initialLeverage={initialLeverage}
        />
      </Box>

      {/* Sticky bottom: summary + button */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
        paddingTop={2}
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        className="shrink-0"
      >
        {orderCalculations && (
          <OrderSummary
            marginRequired={orderCalculations.marginRequired}
            estimatedFees={orderCalculations.estimatedFees}
            liquidationPrice={orderCalculations.liquidationPrice}
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
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handlePrimaryAction}
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
    </Box>
  );
};

export default PerpsOrderEntryPage;
