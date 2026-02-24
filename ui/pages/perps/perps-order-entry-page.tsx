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
  Icon,
  IconName,
  IconSize,
  IconColor,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
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
} from '../../hooks/perps/stream';
import { usePerpsEligibility } from '../../hooks/perps';
import { getPerpsController } from '../../providers/perps';
import {
  getDisplayName,
  safeDecodeURIComponent,
} from '../../components/app/perps/utils';
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
import type {
  OrderType,
  OrderParams,
  PriceUpdate,
} from '@metamask/perps-controller';

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
  const marginAmount = parseFloat(formState.amount) || 0;
  const positionSize =
    currentPrice > 0 ? (marginAmount * formState.leverage) / currentPrice : 0;
  const size =
    mode === 'close' && existingPositionSize
      ? Math.abs(parseFloat(existingPositionSize)).toString()
      : positionSize.toString();
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

  if (formState.type === 'limit' && formState.limitPrice) {
    params.price = formState.limitPrice.replace(/,/gu, '');
  }
  if (formState.autoCloseEnabled && formState.takeProfitPrice) {
    params.takeProfitPrice = formState.takeProfitPrice.replace(/,/gu, '');
  }
  if (formState.autoCloseEnabled && formState.stopLossPrice) {
    params.stopLossPrice = formState.stopLossPrice.replace(/,/gu, '');
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
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const isPerpsEnabled = useSelector(getIsPerpsEnabled);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { isEligible } = usePerpsEligibility();

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
    const cleaned = orderFormState.limitPrice?.replace(/,/gu, '') ?? '';
    const parsed = parseFloat(cleaned);
    return !cleaned || isNaN(parsed) || parsed <= 0;
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
        // Controller not ready
      }
    };
    subscribe();
    return () => {
      cancelled = true;
      unsubscribe?.();
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
              });
            }
          },
        });
      } catch {
        // Controller not ready
      }
    };
    subscribe();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [decodedSymbol, selectedAddress]);

  const marketPrice = useMemo(() => {
    if (!market) {
      return 0;
    }
    return parseFloat(market.price.replace(/[$,]/gu, ''));
  }, [market]);

  const currentPrice = useMemo(() => {
    if (livePrice?.markPrice) {
      const p = parseFloat(livePrice.markPrice);
      if (!Number.isNaN(p) && p > 0) {
        return p;
      }
    }
    if (livePrice?.price) {
      const p =
        typeof livePrice.price === 'string'
          ? parseFloat(livePrice.price)
          : livePrice.price;
      if (!Number.isNaN(p) && p > 0) {
        return p;
      }
    }
    return marketPrice;
  }, [livePrice, marketPrice]);

  const availableBalance = account ? parseFloat(account.availableBalance) : 0;

  const isSubmitDisabled =
    !isEligible || isOrderPending || isLimitPriceInvalid || currentPrice <= 0;

  const maxLeverage = useMemo(() => {
    if (!market) {
      return 50;
    }
    return parseInt(market.maxLeverage.replace('x', ''), 10);
  }, [market]);

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
      const controller = await getPerpsController(selectedAddress);

      if (orderMode === 'close' && position) {
        const closeParams = {
          symbol: orderFormState.asset,
          orderType: 'market' as const,
          currentPrice,
        };
        const result = await controller.closePosition(closeParams);
        if (!result.success) {
          throw new Error(result.error || 'Failed to close position');
        }
      } else if (orderMode === 'modify' && position) {
        const cleanTp =
          orderFormState.autoCloseEnabled && orderFormState.takeProfitPrice
            ? orderFormState.takeProfitPrice.replace(/,/gu, '')
            : undefined;
        const cleanSl =
          orderFormState.autoCloseEnabled && orderFormState.stopLossPrice
            ? orderFormState.stopLossPrice.replace(/,/gu, '')
            : undefined;
        const result = await controller.updatePositionTPSL({
          symbol: orderFormState.asset,
          takeProfitPrice: cleanTp || undefined,
          stopLossPrice: cleanSl || undefined,
        });
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
        const result = await controller.placeOrder(orderParams);
        if (!result.success) {
          throw new Error(result.error || 'Failed to place order');
        }

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

  if (!isPerpsEnabled) {
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
      {/* Header: Back (left) + Long/Short toggle (centered) + spacer (right) */}
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
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="flex-1 min-w-0"
        >
          <DirectionTabs
            direction={orderDirection}
            onDirectionChange={setOrderDirection}
          />
        </Box>
        <Box className="w-9 shrink-0" aria-hidden="true" />
      </Box>

      {/* Scrollable form */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
        className={twMerge(
          'flex-1 overflow-y-auto overflow-x-hidden',
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
          showOrderSummary={false}
          onFormStateChange={handleFormStateChange}
          onCalculationsChange={handleCalculationsChange}
          mode={orderMode}
          orderType={orderType}
          existingPosition={existingPositionForOrder}
          midPrice={topOfBook?.midPrice}
          onOrderTypeChange={setOrderType}
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
