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
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  selectPerpsTradeConfigurations,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';
import {
  CandlePeriod,
  TimeDuration,
} from '../../components/app/perps/constants/chartConfig';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import {
  isLimitPriceUnfavorable as checkLimitPriceUnfavorable,
  isNearLiquidationPrice as checkNearLiquidationPrice,
} from '../../components/app/perps/order-entry/limit-price-warnings';
import {
  OrderEntry,
  DirectionTabs,
  OrderSummary,
  type OrderDirection,
  type OrderFormState,
  type OrderMode,
  type OrderCalculations,
} from '../../components/app/perps/order-entry';
import { PerpsDetailPageSkeleton } from '../../components/app/perps/perps-skeletons';
import {
  getDisplayName,
  getChangeColor,
  safeDecodeURIComponent,
} from '../../components/app/perps/utils';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../helpers/constants/routes';
import { usePerpsEligibility } from '../../hooks/perps';
import {
  usePerpsLivePositions,
  usePerpsLiveAccount,
  usePerpsLiveMarketData,
  usePerpsLiveCandles,
} from '../../hooks/perps/stream';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useFormatters } from '../../hooks/useFormatters';
import { getPerpsStreamManager } from '../../providers/perps';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { submitRequestToBackground } from '../../store/background-connection';

function toNormalizedPositivePrice(value?: string): string | undefined {
  const parsed = Number.parseFloat(value ?? '');
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed.toString();
}

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
      ? Math.abs(parseFloat(existingPositionSize)).toString()
      : positionSize.toString();

  const params: OrderParams = {
    symbol: formState.asset,
    isBuy,
    size,
    orderType: formState.type,
    leverage: formState.leverage,
    currentPrice,
    usdAmount: marginAmount > 0 ? marginAmount.toFixed(2) : '0',
  };

  if (formState.type === 'limit' && formState.limitPrice) {
    params.price = toNormalizedPositivePrice(formState.limitPrice);
  }
  if (formState.autoCloseEnabled && formState.takeProfitPrice) {
    params.takeProfitPrice = toNormalizedPositivePrice(
      formState.takeProfitPrice,
    );
  }
  if (formState.autoCloseEnabled && formState.stopLossPrice) {
    params.stopLossPrice = toNormalizedPositivePrice(formState.stopLossPrice);
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingOrderSymbol, setPendingOrderSymbol] = useState<string | null>(
    null,
  );

  const isOrderPending = isSubmitting || pendingOrderSymbol !== null;

  const isLimitPriceInvalid = useMemo(() => {
    if (orderType !== 'limit' || !orderFormState) {
      return false;
    }
    const parsed = Number.parseFloat(orderFormState.limitPrice ?? '');
    return !Number.isFinite(parsed) || parsed <= 0;
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
      { symbols: [decodedSymbol] },
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
          markPrice: mark ?? update.price,
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
    return lastCandle?.close ? parseFloat(lastCandle.close) : 0;
  }, [candleData]);

  const currentPrice = chartCurrentPrice > 0 ? chartCurrentPrice : marketPrice;

  const availableBalance = account ? parseFloat(account.availableBalance) : 0;

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

  const handleBackClick = useCallback(() => {
    if (!decodedSymbol) {
      return;
    }
    navigate(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(decodedSymbol)}`,
    );
  }, [navigate, decodedSymbol]);

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
    setSubmitError(null);

    try {
      if (orderMode === 'close' && position) {
        const closeParams = {
          symbol: orderFormState.asset,
          orderType: 'market' as const,
          currentPrice,
        };
        const result = await submitRequestToBackground<{
          success: boolean;
          error?: string;
        }>('perpsClosePosition', [closeParams]);
        if (!result.success) {
          throw new Error(result.error || 'Failed to close position');
        }
      } else if (orderMode === 'modify' && position) {
        const marginAmount =
          parseFloat(orderFormState.amount.replace(/,/gu, '')) || 0;

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
            throw new Error(result.error || 'Failed to add to position');
          }

          submitRequestToBackground('perpsSaveTradeConfiguration', [
            orderFormState.asset,
            orderFormState.leverage,
          ]).catch(() => {
            // Non-critical — silently ignore
          });

          // Existing position is already in `allPositions`, so pending-order
          // confirmation would resolve immediately; navigate like limit orders.
          handleBackClick();
          return;
        }

        // Amount is 0: only update TP/SL
        const cleanTp =
          orderFormState.autoCloseEnabled && orderFormState.takeProfitPrice
            ? toNormalizedPositivePrice(orderFormState.takeProfitPrice)
            : undefined;
        const cleanSl =
          orderFormState.autoCloseEnabled && orderFormState.stopLossPrice
            ? toNormalizedPositivePrice(orderFormState.stopLossPrice)
            : undefined;
        const result = await submitRequestToBackground<{
          success: boolean;
          error?: string;
        }>('perpsUpdatePositionTPSL', [
          {
            symbol: orderFormState.asset,
            takeProfitPrice: cleanTp || undefined,
            stopLossPrice: cleanSl || undefined,
          },
        ]);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update TP/SL');
        }
      } else {
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
          throw new Error(result.error || 'Failed to place order');
        }

        submitRequestToBackground('perpsSaveTradeConfiguration', [
          orderFormState.asset,
          orderFormState.leverage,
        ]).catch(() => {
          // Non-critical — silently ignore
        });

        if (orderFormState.type === 'limit') {
          handleBackClick();
          return;
        }
        setPendingOrderSymbol(orderFormState.asset);
        return;
      }
      handleBackClick();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
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
    handleBackClick,
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
      setIsSubmitting(false);
      handleBackClick();
    }
  }, [pendingOrderSymbol, allPositions, handleBackClick]);

  useEffect(() => {
    if (!pendingOrderSymbol) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setPendingOrderSymbol(null);
      setIsSubmitting(false);
      handleBackClick();
    }, 15000);
    return () => clearTimeout(timeout);
  }, [pendingOrderSymbol, handleBackClick]);

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
          onClick={handleBackClick}
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
            <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
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
    </Box>
  );
};

export default PerpsOrderEntryPage;
