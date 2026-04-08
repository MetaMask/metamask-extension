import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
  OrderType,
  OrderParams,
  PriceUpdate,
} from '@metamask/perps-controller';
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
import { usePerpsEligibility } from '../../hooks/perps';
import { useFormatters } from '../../hooks/useFormatters';
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
} from '../../components/app/perps/utils';
import {
  isLimitPriceUnfavorable as checkLimitPriceUnfavorable,
  isNearLiquidationPrice as checkNearLiquidationPrice,
} from '../../components/app/perps/order-entry/limit-price-warnings';
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

const ORDER_FAILED_FALLBACK_ERROR_PATTERNS = [
  /^an unknown error occurred$/iu,
  /^failed to place order$/iu,
  /^unknown error$/iu,
  /^error$/iu,
];

const ORDER_FAILED_USER_FACING_ERROR_PATTERNS = [
  /insufficient margin/iu,
  /insufficient balance/iu,
  /insufficient liquidity|IOC.*cancel/iu,
  /\bno liquidity\b/iu,
  /rate limit/iu,
  /timeout/iu,
  /network error/iu,
  /slippage/iu,
  /order rejected/iu,
  /reduce only|reduceOnly/iu,
  /position would flip/iu,
  /service unavailable|503|temporarily unavailable/iu,
  /fetch failed|connection failed/iu,
];

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
  const tradeConfigurations = useSelector(selectPerpsTradeConfigurations);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const { formatPercentWithMinThreshold } = useFormatters();
  const { replacePerpsToastByKey, hidePerpsToast } = usePerpsToast();

  const { positions: allPositions } = usePerpsLivePositions();
  const { account } = usePerpsLiveAccount();
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  const decodedSymbol = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    return safeDecodeURIComponent(symbol);
  }, [symbol]);

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

  const isOrderPending = isSubmitting || pendingOrderSymbol !== null;

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

  const availableBalance = account
    ? Number.parseFloat(account.availableBalance)
    : 0;

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

  const isSubmitDisabled =
    !isEligible ||
    !selectedAddress ||
    isOrderPending ||
    isLimitPriceInvalid ||
    isLimitPriceUnfavorable ||
    isNearLiquidation ||
    currentPrice <= 0;

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

  const displayChange =
    livePrice?.percentChange24h ?? market?.change24hPercent ?? '';

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

    const directionLabel = (() => {
      if (orderMode === 'close' && position?.size) {
        return Number.parseFloat(position.size) >= 0
          ? t('perpsLong')
          : t('perpsShort');
      }
      return orderFormState.direction === 'long'
        ? t('perpsLong')
        : t('perpsShort');
    })();

    const rawAssetSymbol = orderFormState.asset;
    const displayAssetSymbol = getDisplayName(rawAssetSymbol);

    const formattedPositionSize = orderCalculations?.positionSize?.trim();
    if (formattedPositionSize) {
      const rawAmount = formattedPositionSize.endsWith(` ${rawAssetSymbol}`)
        ? formattedPositionSize.slice(0, -` ${rawAssetSymbol}`.length).trimEnd()
        : formattedPositionSize;

      if (rawAmount) {
        return t('perpsToastOrderPlacementSubtitle', [
          directionLabel,
          rawAmount,
          displayAssetSymbol,
        ]);
      }
    }

    if (orderMode !== 'close' || !position?.size) {
      return undefined;
    }

    const absoluteSize = Math.abs(Number.parseFloat(position.size));
    if (Number.isNaN(absoluteSize)) {
      return undefined;
    }

    const rawAmount = absoluteSize.toString();

    return t('perpsToastOrderPlacementSubtitle', [
      directionLabel,
      rawAmount,
      displayAssetSymbol,
    ]);
  }, [orderCalculations, orderFormState, orderMode, position, t]);

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

  const handleFormStateChange = useCallback((formState: OrderFormState) => {
    setOrderFormState(formState);
  }, []);

  const handleCalculationsChange = useCallback(
    (calculations: OrderCalculations) => {
      setOrderCalculations(calculations);
    },
    [],
  );

  const handleOrderSubmit = useCallback(async () => {
    if (
      !isEligible ||
      !orderFormState ||
      !selectedAddress ||
      currentPrice <= 0
    ) {
      return;
    }

    setIsSubmitting(true);
    setPendingOrderToastDescription(null);

    const tradeActionToastDescription = getTradeActionToastDescription();
    const closeSuccessToastDescription =
      getCloseSuccessToastDescription() ?? tradeActionToastDescription;

    const inProgressToastKey = ORDER_MODE_TOAST_KEYS[orderMode].inProgress;
    const inProgressToastDescription =
      inProgressToastKey === PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS
        ? undefined
        : tradeActionToastDescription;
    if (inProgressToastKey) {
      replacePerpsToastByKey({
        key: inProgressToastKey,
        ...(inProgressToastDescription
          ? { description: inProgressToastDescription }
          : {}),
      });
    }

    try {
      if (orderMode === 'close' && position) {
        const closeParams = {
          symbol: orderFormState.asset,
          orderType: 'market' as const,
          currentPrice,
        };
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsClosePosition',
          [closeParams],
        );
        if (!result.success) {
          throw new Error(result.error ?? 'Failed to close position');
        }
        handleBackClick(
          PERPS_TOAST_KEYS.TRADE_SUCCESS,
          closeSuccessToastDescription,
        );
        return;
      }

      if (orderMode === 'modify' && position) {
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
            throw new Error(result.error ?? 'Failed to add to position');
          }

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
        if (!result.success) {
          throw new Error(result.error ?? 'Failed to update TP/SL');
        }
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
        throw new Error(result.error ?? 'Failed to place order');
      }

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
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      const failedToastKey = ORDER_MODE_TOAST_KEYS[orderMode].failed;
      const normalizedErrorMessage = errorMessage.trim();
      const shouldUseOrderFailedFallback =
        failedToastKey === PERPS_TOAST_KEYS.ORDER_FAILED &&
        (normalizedErrorMessage.length === 0 ||
          ORDER_FAILED_FALLBACK_ERROR_PATTERNS.some((pattern) =>
            pattern.test(normalizedErrorMessage),
          ) ||
          !ORDER_FAILED_USER_FACING_ERROR_PATTERNS.some((pattern) =>
            pattern.test(normalizedErrorMessage),
          ));
      const failedToastDescription = shouldUseOrderFailedFallback
        ? t('perpsToastOrderFailedDescriptionFallback')
        : normalizedErrorMessage;

      replacePerpsToastByKey({
        key: failedToastKey,
        description: failedToastDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isEligible,
    orderFormState,
    orderMode,
    position,
    selectedAddress,
    currentPrice,
    getTradeActionToastDescription,
    getCloseSuccessToastDescription,
    handleBackClick,
    hidePerpsToast,
    replacePerpsToastByKey,
    t,
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
  })();

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
          onDirectionChange={setOrderDirection}
        />
        <OrderEntry
          asset={decodedSymbol}
          currentPrice={currentPrice}
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
    </Box>
  );
};

export default PerpsOrderEntryPage;
