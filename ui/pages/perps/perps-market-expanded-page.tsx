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
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonBase,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import type { PriceUpdate, OrderParams } from '@metamask/perps-controller';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_EXPANDED_ROUTE,
  PERPS_ROUTE,
} from '../../helpers/constants/routes';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveAccount,
  usePerpsLiveMarketData,
  usePerpsLiveCandles,
  usePerpsLiveOrderBook,
} from '../../hooks/perps/stream';
import { usePerpsEligibility } from '../../hooks/perps';
import { getPerpsStreamManager } from '../../providers/perps';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  PerpsCandlestickChart,
  type PerpsCandlestickChartRef,
} from '../../components/app/perps/perps-candlestick-chart';
import { PerpsCandlePeriodSelector } from '../../components/app/perps/perps-candle-period-selector';
import {
  CandlePeriod,
  TimeDuration,
  ZOOM_CONFIG,
} from '../../components/app/perps/constants/chartConfig';
import {
  getChangeColor,
  safeDecodeURIComponent,
} from '../../components/app/perps/utils';
import { PerpsDetailPageSkeleton } from '../../components/app/perps/perps-skeletons';
import {
  OrderEntry,
  type OrderFormState,
} from '../../components/app/perps/order-entry';
import { PerpsPositionsOrders } from '../../components/app/perps';
import { PerpsOrderBook } from '../../components/app/perps/perps-order-book';
import { PerpsMarketSelector } from '../../components/app/perps/perps-market-selector';
import { useFormatters } from '../../hooks/useFormatters';
import {
  usePerpsToast,
  PERPS_TOAST_KEYS,
} from '../../components/app/perps/perps-toast';
import {
  selectPerpsTradeConfigurations,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';
import type { PerpsBackgroundResult } from '../../components/app/perps/types/index';
const BORDER_COLOR = 'rgba(255,255,255,0.08)';

/** Derive a numeric price from formatted market price string. */
function parseMarketPrice(formatted: string): number {
  return parseFloat(formatted.replace(/[$,]/gu, '')) || 0;
}

/** Minimal conversion from OrderFormState → OrderParams for a new order. */
function buildOrderParams(
  formState: OrderFormState,
  currentPrice: number,
): OrderParams {
  const isBuy = formState.direction === 'long';
  const marginAmount = Number.parseFloat(formState.amount) || 0;
  const positionSize =
    currentPrice > 0 ? (marginAmount * formState.leverage) / currentPrice : 0;
  const cleanAmount = formState.amount.replaceAll(',', '');

  const params: OrderParams = {
    symbol: formState.asset,
    isBuy,
    size: positionSize.toString(),
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

  return params;
}

const DEFAULT_LEVERAGE = 3;

/**
 * PerpsMarketExpandedPage — full-width trading view for MetaMask expanded view.
 *
 * Layout:
 *   Sticky header  : Market selector + live price + key stats
 *   Middle row     : Chart (55fr) | Order Book (20fr) | Order Form (25fr)
 *   Bottom panel   : Positions / Open Orders
 *
 * This page is only rendered when the extension is open in home.html
 * (full-size view). Navigating to /perps/market/:symbol while in
 * fullscreen redirects here automatically.
 */
const PerpsMarketExpandedPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { isEligible } = usePerpsEligibility();
  const { formatNumber } = useFormatters();
  const { replacePerpsToastByKey } = usePerpsToast();
  const tradeConfigurations = useSelector(selectPerpsTradeConfigurations);
  const isTestnet = useSelector(selectPerpsIsTestnet);

  const [selectedPeriod, setSelectedPeriod] = useState(
    CandlePeriod.FiveMinutes,
  );
  const [isOrderPending, setIsOrderPending] = useState(false);
  const chartRef = useRef<PerpsCandlestickChartRef>(null);
  const chartColumnRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(480);

  // Measure the chart column to set an appropriate canvas height
  useEffect(() => {
    const el = chartColumnRef.current;
    if (!el) {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Reserve space for the period selector (~48px) and padding (~24px)
        const available = entry.contentRect.height - 72;
        if (available > 100) {
          setChartHeight(available);
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const decodedSymbol = useMemo(
    () => (symbol ? safeDecodeURIComponent(symbol) : undefined),
    [symbol],
  );

  // ── Stream hooks ──────────────────────────────────────────────────────────
  const { positions: allPositions } = usePerpsLivePositions();
  const { orders: allOrders } = usePerpsLiveOrders();
  const { account } = usePerpsLiveAccount();
  const { markets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  const {
    candleData,
    isInitialLoading: candlesLoading,
    fetchMoreHistory,
  } = usePerpsLiveCandles({
    symbol: decodedSymbol ?? '',
    interval: selectedPeriod,
    duration: TimeDuration.OneWeek,
  });

  const { orderBook, isInitialLoading: orderBookLoading } =
    usePerpsLiveOrderBook({
      symbol: decodedSymbol ?? '',
      levels: 15,
    });

  // ── Activate price stream ─────────────────────────────────────────────────
  const [livePrice, setLivePrice] = useState<PriceUpdate | undefined>();
  useEffect(() => {
    if (!decodedSymbol || !selectedAddress) {
      setLivePrice(undefined);
      return undefined;
    }
    submitRequestToBackground('perpsActivatePriceStream', [
      { symbols: [decodedSymbol], includeMarketData: true },
    ]).catch(() => {});
    const streamManager = getPerpsStreamManager();
    const unsubscribe = streamManager.prices.subscribe((updates) => {
      const update = updates.find((p) => p.symbol === decodedSymbol);
      if (update) {
        setLivePrice({
          symbol: update.symbol,
          price: update.price,
          timestamp: (update as { timestamp?: number }).timestamp ?? Date.now(),
          percentChange24h: update.percentChange24h,
          markPrice: (update as { markPrice?: string }).markPrice,
        });
      }
    });
    return () => {
      submitRequestToBackground('perpsDeactivatePriceStream', []);
      unsubscribe();
    };
  }, [decodedSymbol, selectedAddress]);

  // ── Activate order book stream ────────────────────────────────────────────
  useEffect(() => {
    if (!decodedSymbol || !selectedAddress) {
      return undefined;
    }
    submitRequestToBackground('perpsActivateOrderBookStream', [
      { symbol: decodedSymbol },
    ]).catch(() => {});
    return () => {
      submitRequestToBackground('perpsDeactivateOrderBookStream', []);
    };
  }, [decodedSymbol, selectedAddress]);

  // ── Derived values ────────────────────────────────────────────────────────
  const market = useMemo(
    () =>
      decodedSymbol
        ? markets.find(
            (m) => m.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
          )
        : undefined,
    [decodedSymbol, markets],
  );

  const marketPrice = useMemo(
    () => (market ? parseMarketPrice(market.price) : 0),
    [market],
  );

  const chartCurrentPrice = useMemo(() => {
    if (!candleData?.candles?.length) {
      return 0;
    }
    const last = candleData.candles.at(-1);
    return last?.close ? Number.parseFloat(last.close) : 0;
  }, [candleData]);

  const currentPrice = chartCurrentPrice > 0 ? chartCurrentPrice : marketPrice;

  const availableBalance = account
    ? Number.parseFloat(account.availableBalance)
    : 0;

  const maxLeverage = useMemo(() => {
    if (!market) {
      return 50;
    }
    return parseInt(market.maxLeverage.replace('x', ''), 10);
  }, [market]);

  const initialLeverage = useMemo(() => {
    if (!decodedSymbol) {
      return DEFAULT_LEVERAGE;
    }
    const env = isTestnet ? 'testnet' : 'mainnet';
    const config = tradeConfigurations[env]?.[decodedSymbol];
    const saved = config?.leverage ?? DEFAULT_LEVERAGE;
    return Math.min(saved, maxLeverage);
  }, [decodedSymbol, maxLeverage, tradeConfigurations, isTestnet]);

  const midPrice = useMemo(
    () => (orderBook?.midPrice ? parseFloat(orderBook.midPrice) : undefined),
    [orderBook],
  );

  const displayPrice = useMemo(() => {
    const raw = livePrice?.price ?? currentPrice;
    if (!raw) {
      return market?.price ?? '--';
    }
    return `$${formatNumber(Number(raw), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [livePrice, currentPrice, market, formatNumber]);

  const displayChange =
    livePrice?.percentChange24h ?? market?.change24hPercent ?? '';
  const changeColor = getChangeColor(displayChange);

  // Show all positions and orders across all markets in the bottom panel
  const positions = allPositions;
  const orders = allOrders;

  // ── Order submission ──────────────────────────────────────────────────────
  const handleOrderSubmit = useCallback(
    async (formState: OrderFormState) => {
      if (!isEligible || !selectedAddress || currentPrice <= 0) {
        return;
      }
      setIsOrderPending(true);
      replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS });
      try {
        const params = buildOrderParams(formState, currentPrice);
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsPlaceOrder',
          [params],
        );
        if (!result.success) {
          throw new Error(result.error ?? 'Order failed');
        }
        replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.ORDER_SUBMITTED });
      } catch {
        replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.ORDER_FAILED });
      } finally {
        setIsOrderPending(false);
      }
    },
    [isEligible, selectedAddress, currentPrice, replacePerpsToastByKey],
  );

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  if (!decodedSymbol) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  if (marketsLoading) {
    return <PerpsDetailPageSkeleton />;
  }

  if (!market) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        style={{ height: '100vh' }}
      >
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('perpsMarketNotFound')}
        </Text>
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Sm}
          onClick={() => navigate(DEFAULT_ROUTE)}
        >
          {t('back')}
        </Button>
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-background-default)',
        width: '100%',
        alignSelf: 'stretch',
      }}
    >
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '10px 16px',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          flexWrap: 'wrap',
        }}
      >
        {/* Back button → perps tab */}
        <ButtonBase
          onClick={() => navigate(DEFAULT_ROUTE)}
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          aria-label="Back to Perps"
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.iconDefault}
          />
        </ButtonBase>

        {/* Market selector */}
        <PerpsMarketSelector
          markets={markets}
          currentSymbol={decodedSymbol}
          currentPrice={displayPrice}
        />

        {/* Price + change */}
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text
            variant={TextVariant.bodyLgMedium}
            color={TextColor.textDefault}
            fontWeight={FontWeight.Bold}
          >
            {displayPrice}
          </Text>
          <Text variant={TextVariant.bodyXs} style={{ color: changeColor }}>
            {displayChange}
          </Text>
        </Box>

        {/* Stat: 24h volume */}
        {market.volume && (
          <Box flexDirection={BoxFlexDirection.Column}>
            <Text
              variant={TextVariant.bodyXs}
              color={TextColor.textAlternative}
            >
              24h Vol
            </Text>
            <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
              {market.volume}
            </Text>
          </Box>
        )}

        {/* Stat: Open interest */}
        {market.openInterest && (
          <Box flexDirection={BoxFlexDirection.Column}>
            <Text
              variant={TextVariant.bodyXs}
              color={TextColor.textAlternative}
            >
              OI
            </Text>
            <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
              {market.openInterest}
            </Text>
          </Box>
        )}

        {/* Stat: Funding rate */}
        {market.fundingRate !== undefined && (
          <Box flexDirection={BoxFlexDirection.Column}>
            <Text
              variant={TextVariant.bodyXs}
              color={TextColor.textAlternative}
            >
              Funding
            </Text>
            <Text
              variant={TextVariant.bodySm}
              color={
                market.fundingRate >= 0
                  ? TextColor.successDefault
                  : TextColor.errorDefault
              }
            >
              {(market.fundingRate * 100).toFixed(4)}%
            </Text>
          </Box>
        )}

        {/* Stat: Max leverage */}
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
            Max lev.
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
            {market.maxLeverage}
          </Text>
        </Box>
      </header>

      {/* ── Middle row: Chart | Order Book | Order Form ───────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '55fr 20fr 25fr',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Chart column */}
        <div
          ref={chartColumnRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '12px 12px 0',
              overflow: 'hidden',
            }}
          >
            {candlesLoading ? (
              <div
                style={{
                  height: chartHeight,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <PerpsCandlestickChart
                ref={chartRef}
                height={chartHeight}
                selectedPeriod={selectedPeriod}
                candleData={candleData}
                onNeedMoreHistory={fetchMoreHistory}
                onPeriodDataRequest={() => {}}
              />
            )}
          </div>
          <div
            style={{
              flexShrink: 0,
              padding: '8px 12px 12px',
            }}
          >
            <PerpsCandlePeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={(period) => {
                setSelectedPeriod(period);
                chartRef.current?.applyZoom(ZOOM_CONFIG.DEFAULT_CANDLES, true);
              }}
            />
          </div>
        </div>

        {/* Order Book column */}
        <div
          style={{
            overflow: 'hidden',
            borderRight: `1px solid ${BORDER_COLOR}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.SpaceBetween}
            style={{
              padding: '10px 8px 4px',
              flexShrink: 0,
            }}
          >
            <Text
              variant={TextVariant.bodySmMedium}
              color={TextColor.textDefault}
              fontWeight={FontWeight.Medium}
            >
              Order Book
            </Text>
          </Box>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <PerpsOrderBook
              orderBook={orderBook}
              isLoading={orderBookLoading}
            />
          </div>
        </div>

        {/* Order Form column */}
        <div
          style={{
            overflowY: 'auto',
            padding: '12px',
          }}
        >
          <OrderEntry
            asset={decodedSymbol}
            currentPrice={currentPrice}
            maxLeverage={maxLeverage}
            availableBalance={availableBalance}
            midPrice={midPrice}
            initialLeverage={initialLeverage}
            showSubmitButton
            onSubmit={handleOrderSubmit}
          />
        </div>
      </div>

      {/* ── Positions / Orders bottom panel ───────────────────────────────── */}
      {(positions.length > 0 || orders.length > 0) && (
        <div
          style={{
            flexShrink: 0,
            maxHeight: '280px',
            overflowY: 'auto',
            borderTop: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <PerpsPositionsOrders positions={positions} orders={orders} />
        </div>
      )}
    </div>
  );
};

export default PerpsMarketExpandedPage;
