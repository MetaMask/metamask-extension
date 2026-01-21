import React, { useMemo, useCallback, useState, useRef } from 'react';
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
} from '@metamask/design-system-react';
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { mockPositions, mockOrders } from '../../components/app/perps/mocks';
import { OrderCard } from '../../components/app/perps/order-card';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import {
  PerpsCandlestickChart,
  PerpsCandlestickChartRef,
} from '../../components/app/perps/perps-candlestick-chart';
import { PerpsCandlePeriodSelector } from '../../components/app/perps/perps-candle-period-selector';
import {
  CandlePeriod,
  ZOOM_CONFIG,
} from '../../components/app/perps/constants/chartConfig';
import {
  getDisplayName,
  findMarketBySymbol,
  safeDecodeURIComponent,
  getChangeColor,
} from '../../components/app/perps/utils';
import { useFormatters } from '../../hooks/useFormatters';

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
  const { formatCurrencyWithMinThreshold } = useFormatters();
  // Safely decode the symbol from URL
  const decodedSymbol = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    return safeDecodeURIComponent(symbol);
  }, [symbol]);

  // Find market data for the given symbol
  const market = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return findMarketBySymbol(decodedSymbol);
  }, [decodedSymbol]);

  // Find position for this market (if exists)
  const position = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    return mockPositions.find(
      (pos) => pos.coin.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [decodedSymbol]);

  // Find orders for this market
  const orders = useMemo(() => {
    if (!decodedSymbol) {
      return [];
    }
    return mockOrders.filter(
      (order) =>
        order.symbol.toLowerCase() === decodedSymbol.toLowerCase() &&
        order.status === 'open',
    );
  }, [decodedSymbol]);

  // Candle period state and chart ref
  const [selectedPeriod, setSelectedPeriod] = useState<CandlePeriod>(
    CandlePeriod.FiveMinutes,
  );
  const chartRef = useRef<PerpsCandlestickChartRef>(null);

  // Handle candle period change
  const handlePeriodChange = useCallback((period: CandlePeriod) => {
    setSelectedPeriod(period);
    // Apply default zoom when period changes
    if (chartRef.current) {
      chartRef.current.applyZoom(ZOOM_CONFIG.DEFAULT_CANDLES, true);
    }
  }, []);

  // Navigation handlers
  const handleBackClick = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

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

  // If market not found, show error state
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

        {/* Symbol and Price */}
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
              {market.price}
            </Text>
            <Text
              variant={TextVariant.BodyXs}
              color={getChangeColor(market.change24hPercent)}
              data-testid="perps-market-detail-change"
            >
              {market.change24h} ({market.change24hPercent})
            </Text>
          </Box>
        </Box>

        {/* Spacer */}
        <Box className="flex-1" />

        {/* Favorite Star */}
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

      {/* Candlestick Chart */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        data-testid="perps-market-detail-chart"
      >
        <PerpsCandlestickChart
          ref={chartRef}
          height={250}
          selectedPeriod={selectedPeriod}
        />
      </Box>

      {/* Candle Period Selector */}
      <PerpsCandlePeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

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
                  {parseFloat(position.returnOnEquity) >= 0 ? '+' : ''}
                  {position.returnOnEquity}%
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
                  {Math.abs(parseFloat(position.size)).toFixed(5)}{' '}
                  {getDisplayName(position.coin)}
                </Text>
              </Box>

              {/* Margin Card */}
              <Box
                className="flex-1 cursor-pointer rounded-xl bg-muted px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed"
                flexDirection={BoxFlexDirection.Column}
                onClick={() => {
                  // TODO: Handle margin card press
                }}
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
                  ${position.marginUsed}
                </Text>
              </Box>
            </Box>

            {/* Third Row: Auto Close (Full Width) */}
            <Box
              className="cursor-pointer rounded-xl bg-muted px-4 py-3 hover:bg-muted-hover active:bg-muted-pressed"
              flexDirection={BoxFlexDirection.Column}
              onClick={() => {
                // TODO: Handle auto close card press
              }}
            >
              <Box paddingBottom={1}>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsAutoClose')}
                </Text>
              </Box>
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                TP{' '}
                {position.takeProfitPrice
                  ? `$${position.takeProfitPrice}`
                  : '-'}
                , SL{' '}
                {position.stopLossPrice ? `$${position.stopLossPrice}` : '-'}
              </Text>
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
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
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {t('perpsOpenInterest')}
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {t('perpsFundingRate')}
              </Text>
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
                {(market.fundingRate * 100).toFixed(4)}%
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Recent Activity Section - always visible */}
      <Box paddingLeft={4} paddingRight={4}>
        <Box paddingTop={4} paddingBottom={2}>
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
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
            <PerpsTokenLogo symbol={market.symbol} size={AvatarTokenSize.Md} />
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Start}
              className="min-w-0 flex-1"
              gap={1}
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
            <PerpsTokenLogo symbol={market.symbol} size={AvatarTokenSize.Md} />
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Start}
              className="min-w-0 flex-1"
              gap={1}
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
            <PerpsTokenLogo symbol={market.symbol} size={AvatarTokenSize.Md} />
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Start}
              className="min-w-0 flex-1"
              gap={1}
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
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
        <Box paddingTop={4}>
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            {t('perpsDisclaimer')}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsMarketDetailPage;
