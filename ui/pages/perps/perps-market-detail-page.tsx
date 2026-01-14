import React, { useMemo, useCallback } from 'react';
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
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { mockPositions, mockOrders } from '../../components/app/perps/mocks';
import { OrderCard } from '../../components/app/perps/order-card';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import {
  getDisplayName,
  findMarketBySymbol,
  formatPnl,
} from '../../components/app/perps/utils';
import '../../components/app/perps/index.scss';

/**
 * PerpsMarketDetailPage component
 * Displays detailed market information for a specific perps market
 * Accessible via /perps/market/:symbol route
 */
const PerpsMarketDetailPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();

  // Find market data for the given symbol
  const market = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    return findMarketBySymbol(decodeURIComponent(symbol));
  }, [symbol]);

  // Find position for this market (if exists)
  const position = useMemo(() => {
    if (!symbol) {
      return undefined;
    }
    const decodedSymbol = decodeURIComponent(symbol);
    return mockPositions.find(
      (pos) => pos.coin.toLowerCase() === decodedSymbol.toLowerCase(),
    );
  }, [symbol]);

  // Find orders for this market
  const orders = useMemo(() => {
    if (!symbol) {
      return [];
    }
    const decodedSymbol = decodeURIComponent(symbol);
    return mockOrders.filter(
      (order) =>
        order.symbol.toLowerCase() === decodedSymbol.toLowerCase() &&
        order.status === 'open',
    );
  }, [symbol]);

  // Navigation handlers
  const handleBackClick = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  // If no symbol provided, redirect to home
  if (!symbol) {
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
            Market not found
          </Text>
          <Box paddingTop={2}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              The market &quot;
              {getDisplayName(decodeURIComponent(symbol))}&quot; could not be
              found.
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  const displayName = getDisplayName(market.symbol);
  const isPositiveChange = market.change24hPercent.startsWith('+');

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
              color={
                isPositiveChange
                  ? TextColor.SuccessDefault
                  : TextColor.ErrorDefault
              }
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
          aria-label="Add to favorites"
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

      {/* Chart Placeholder */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
        data-testid="perps-market-detail-chart-placeholder"
      >
        <Box
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          className="h-[200px] bg-background-alternative rounded-lg"
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            Chart coming soon
          </Text>
        </Box>
      </Box>

      {/* Divider */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box className="h-px bg-border-muted" />
      </Box>

      {/* Position Section */}
      {position && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Box paddingBottom={2}>
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              Position
            </Text>
          </Box>

          {/* Position Details Cards */}
          <Box flexDirection={BoxFlexDirection.Column} gap={2} paddingTop={2}>
            {/* First Row: P&L and Return */}
            <Box flexDirection={BoxFlexDirection.Row} gap={2}>
              {/* P&L Card */}
              <Box className="perps-position-detail-card flex-1">
                <Box paddingBottom={1}>
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    P&L
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
                  {formatPnl(position.unrealizedPnl)}
                </Text>
              </Box>

              {/* Return Card */}
              <Box className="perps-position-detail-card flex-1">
                <Box paddingBottom={1}>
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    Return
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
                className="perps-position-detail-card perps-position-detail-card--pressable flex-1"
                flexDirection={BoxFlexDirection.Column}
                paddingLeft={4}
                paddingRight={4}
                paddingTop={3}
                paddingBottom={3}
                onClick={() => {
                  // TODO: Handle size card press
                }}
              >
                <Box paddingBottom={1}>
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    Size
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
                className="perps-position-detail-card perps-position-detail-card--pressable flex-1"
                flexDirection={BoxFlexDirection.Column}
                paddingLeft={4}
                paddingRight={4}
                paddingTop={3}
                paddingBottom={3}
                onClick={() => {
                  // TODO: Handle margin card press
                }}
              >
                <Box paddingBottom={1}>
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    Margin
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
              className="perps-position-detail-card perps-position-detail-card--pressable"
              flexDirection={BoxFlexDirection.Column}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
              onClick={() => {
                // TODO: Handle auto close card press
              }}
            >
              <Box paddingBottom={1}>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  Auto close
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
              Details
            </Text>
          </Box>
          <Box className="perps-details-list">
            {/* Direction Row */}
            <Box className="perps-details-list__row perps-details-list__row--first">
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                Direction
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
                {parseFloat(position.size) >= 0 ? 'LONG' : 'SHORT'}
              </Text>
            </Box>

            {/* Entry Price Row */}
            <Box className="perps-details-list__row">
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                Entry price
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                ${position.entryPrice}
              </Text>
            </Box>

            {/* Liquidation Price Row */}
            <Box className="perps-details-list__row">
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                Liquidation price
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {position.liquidationPrice
                  ? `$${position.liquidationPrice}`
                  : '-'}
              </Text>
            </Box>

            {/* Funding Payments Row */}
            <Box className="perps-details-list__row perps-details-list__row--last">
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                Funding payments
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                ${position.cumulativeFunding.sinceOpen}
              </Text>
            </Box>
          </Box>

          {/* Orders Section */}
          {orders.length > 0 && (
            <>
              <Box paddingTop={4} paddingBottom={2}>
                <Text
                  variant={TextVariant.HeadingSm}
                  fontWeight={FontWeight.Medium}
                >
                  Orders
                </Text>
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Column}
                className="perps-list-container"
              >
                {orders.map((order) => (
                  <Box key={order.orderId} className="perps-list-item">
                    <OrderCard order={order} variant="muted" />
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Stats Section */}
          <Box paddingTop={4} paddingBottom={2}>
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              Stats
            </Text>
          </Box>
          <Box className="perps-details-list">
            {/* 24h Volume Row */}
            <Box
              className={`perps-details-list__row perps-details-list__row--first ${
                !market.openInterest && market.fundingRate === undefined
                  ? 'perps-details-list__row--last'
                  : ''
              }`}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                24h Volume
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {market.volume}
              </Text>
            </Box>

            {/* Open Interest Row */}
            {market.openInterest && (
              <Box
                className={`perps-details-list__row ${
                  market.fundingRate === undefined
                    ? 'perps-details-list__row--last'
                    : ''
                }`}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  Open Interest
                </Text>
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
              <Box className="perps-details-list__row perps-details-list__row--last">
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  Funding Rate
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
                  {(market.fundingRate * 100).toFixed(4)}%
                </Text>
              </Box>
            )}
          </Box>

          {/* Recent Activity Section */}
          <Box paddingTop={4} paddingBottom={2}>
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              Recent Activity
            </Text>
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} className="gap-px">
            {/* Activity Item 1 - Opened long */}
            <Box
              className="perps-activity-item perps-activity-item--first w-full"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
            >
              <PerpsTokenLogo
                symbol={position.coin}
                size={AvatarTokenSize.Md}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="flex-1 min-w-0"
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  Opened long
                </Text>
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                >
                  {Math.abs(parseFloat(position.size)).toFixed(5)} {displayName}
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
              className="perps-activity-item w-full"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
            >
              <PerpsTokenLogo
                symbol={position.coin}
                size={AvatarTokenSize.Md}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="flex-1 min-w-0"
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  Increased position
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
              className="perps-activity-item perps-activity-item--last w-full"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={3}
              paddingBottom={3}
            >
              <PerpsTokenLogo
                symbol={position.coin}
                size={AvatarTokenSize.Md}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="flex-1 min-w-0"
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  Closed short
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
            className="perps-position-detail-card perps-position-detail-card--pressable w-full mt-4"
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={3}
            paddingBottom={3}
            onClick={() => {
              // TODO: Navigate to learn page
            }}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              Learn the basics of perps
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>

          {/* Disclaimer */}
          <Box paddingTop={4}>
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {t('perpsDisclaimer')}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PerpsMarketDetailPage;
