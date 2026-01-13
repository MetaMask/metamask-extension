import React, { useMemo, useCallback } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextVariant,
  AlignItems,
  TextColor,
  FontWeight,
  BlockSize,
} from '../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE, PERPS_ROUTE } from '../../helpers/constants/routes';
import {
  mockPositions,
  mockOrders,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../components/app/perps/mocks';
import { PositionCard } from '../../components/app/perps/position-card';
import { OrderCard } from '../../components/app/perps/order-card';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import { AvatarTokenSize } from '../../components/component-library';
import type { PerpsMarketData } from '../../components/app/perps/types';
import '../../components/app/perps/index.scss';

/**
 * Finds market data by symbol from mock data
 * Searches both crypto and HIP-3 markets
 */
const findMarketBySymbol = (symbol: string): PerpsMarketData | undefined => {
  const allMarkets = [...mockCryptoMarkets, ...mockHip3Markets];
  return allMarkets.find(
    (market) => market.symbol.toLowerCase() === symbol.toLowerCase(),
  );
};

/**
 * Extract display name from symbol (strips DEX prefix for HIP-3 markets)
 * e.g., "xyz:TSLA" -> "TSLA", "BTC" -> "BTC"
 */
const getDisplayName = (symbol: string): string => {
  const colonIndex = symbol.indexOf(':');
  if (colonIndex > 0 && colonIndex < symbol.length - 1) {
    return symbol.substring(colonIndex + 1);
  }
  return symbol;
};

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
        <Box
          paddingLeft={2}
          display={Display.Flex}
          paddingBottom={4}
          paddingTop={4}
        >
          <ButtonIcon
            data-testid="perps-market-detail-back-button"
            color={IconColor.iconAlternative}
            marginRight={1}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBackClick}
          />
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          padding={4}
        >
          <Text variant={TextVariant.headingMd} color={TextColor.textDefault}>
            Market not found
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            paddingTop={2}
          >
            The market &quot;{getDisplayName(decodeURIComponent(symbol))}&quot;
            could not be found.
          </Text>
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
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
        gap={2}
      >
        {/* Back Button */}
        <ButtonIcon
          data-testid="perps-market-detail-back-button"
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={handleBackClick}
          style={{ marginRight: '-4px' }}
        />

        {/* Token Logo */}
        <PerpsTokenLogo symbol={market.symbol} size={AvatarTokenSize.Md} />

        {/* Symbol and Price */}
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {/* Symbol */}
          <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
            {displayName}-USD
          </Text>

          {/* Price and Change Row */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.baseline}
            gap={1}
          >
            <Text
              variant={TextVariant.bodySm}
              fontWeight={FontWeight.Medium}
              data-testid="perps-market-detail-price"
            >
              {market.price}
            </Text>
            <Text
              variant={TextVariant.bodyXs}
              color={
                isPositiveChange
                  ? TextColor.successDefault
                  : TextColor.errorDefault
              }
              data-testid="perps-market-detail-change"
            >
              {market.change24h} ({market.change24hPercent})
            </Text>
          </Box>
        </Box>

        {/* Spacer */}
        <Box style={{ flex: 1 }} />

        {/* Favorite Star */}
        <ButtonIcon
          data-testid="perps-market-detail-favorite-button"
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="Add to favorites"
          iconName={IconName.Star}
          onClick={() => {
            // TODO: Handle favorite toggle
          }}
        />
      </Box>

      {/* Chart Placeholder */}
      <Box
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
        data-testid="perps-market-detail-chart-placeholder"
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          style={{
            height: '200px',
            backgroundColor: 'var(--color-background-alternative)',
            borderRadius: '8px',
          }}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            Chart coming soon
          </Text>
        </Box>
      </Box>

      {/* Divider */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <hr style={{ border: '1px solid var(--border-muted, #858B9A33)' }} />
      </Box>

      {/* Position Section */}
      {position && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingBottom={2}
          >
            Position
          </Text>

          {/* Position Details Cards */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            paddingTop={2}
          >
            {/* First Row: P&L and Return */}
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
            >
              {/* P&L Card */}
              <Box className="perps-position-detail-card" style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  paddingBottom={1}
                >
                  P&L
                </Text>
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                  color={
                    parseFloat(position.unrealizedPnl) >= 0
                      ? TextColor.successDefault
                      : TextColor.errorDefault
                  }
                >
                  {parseFloat(position.unrealizedPnl) >= 0 ? '+' : ''}$
                  {position.unrealizedPnl}
                </Text>
              </Box>

              {/* Return Card */}
              <Box className="perps-position-detail-card" style={{ flex: 1 }}>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  paddingBottom={1}
                >
                  Return
                </Text>
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                  color={
                    parseFloat(position.returnOnEquity) >= 0
                      ? TextColor.successDefault
                      : TextColor.errorDefault
                  }
                >
                  {parseFloat(position.returnOnEquity) >= 0 ? '+' : ''}
                  {position.returnOnEquity}%
                </Text>
              </Box>
            </Box>

            {/* Second Row: Size and Margin */}
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
            >
              {/* Size Card */}
              <Box
                className="perps-position-detail-card perps-position-detail-card--pressable"
                style={{ flex: 1 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // TODO: Handle size card press
                  }
                }}
                onClick={() => {
                  // TODO: Handle size card press
                }}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  paddingBottom={1}
                >
                  Size
                </Text>
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {Math.abs(parseFloat(position.size)).toFixed(5)}{' '}
                  {getDisplayName(position.coin)}
                </Text>
              </Box>

              {/* Margin Card */}
              <Box
                className="perps-position-detail-card perps-position-detail-card--pressable"
                style={{ flex: 1 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // TODO: Handle margin card press
                  }
                }}
                onClick={() => {
                  // TODO: Handle margin card press
                }}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  paddingBottom={1}
                >
                  Margin
                </Text>
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  ${position.marginUsed}
                </Text>
              </Box>
            </Box>

            {/* Third Row: Auto Close (Full Width) */}
            <Box
              className="perps-position-detail-card perps-position-detail-card--pressable"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // TODO: Handle auto close card press
                }
              }}
              onClick={() => {
                // TODO: Handle auto close card press
              }}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                paddingBottom={1}
              >
                Auto close
              </Text>
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
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
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingTop={4}
            paddingBottom={2}
          >
            Details
          </Text>
          <div className="perps-details-list">
            {/* Direction Row */}
            <div className="perps-details-list__row perps-details-list__row--first">
              <span className="perps-details-list__label">Direction</span>
              <span
                className={`perps-details-list__value ${
                  parseFloat(position.size) >= 0
                    ? 'perps-details-list__value--long'
                    : 'perps-details-list__value--short'
                }`}
              >
                {parseFloat(position.size) >= 0 ? 'LONG' : 'SHORT'}
              </span>
            </div>

            {/* Entry Price Row */}
            <div className="perps-details-list__row">
              <span className="perps-details-list__label">Entry price</span>
              <span className="perps-details-list__value">
                ${position.entryPrice}
              </span>
            </div>

            {/* Liquidation Price Row */}
            <div className="perps-details-list__row">
              <span className="perps-details-list__label">
                Liquidation price
              </span>
              <span className="perps-details-list__value">
                {position.liquidationPrice
                  ? `$${position.liquidationPrice}`
                  : '-'}
              </span>
            </div>

            {/* Funding Payments Row */}
            <div className="perps-details-list__row perps-details-list__row--last">
              <span className="perps-details-list__label">
                Funding payments
              </span>
              <span className="perps-details-list__value">
                ${position.cumulativeFunding.sinceOpen}
              </span>
            </div>
          </div>

          {/* Orders Section */}
          {orders.length > 0 && (
            <>
              <Text
                variant={TextVariant.headingSm}
                fontWeight={FontWeight.Medium}
                paddingTop={4}
                paddingBottom={2}
              >
                Orders
              </Text>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                style={{ gap: '1px' }}
              >
                {orders.map((order, index) => (
                  <div
                    key={order.orderId}
                    style={{
                      borderRadius:
                        orders.length === 1
                          ? '12px'
                          : index === 0
                            ? '12px 12px 0 0'
                            : index === orders.length - 1
                              ? '0 0 12px 12px'
                              : '0',
                      overflow: 'hidden',
                    }}
                  >
                    <OrderCard order={order} variant="muted" />
                  </div>
                ))}
              </Box>
            </>
          )}

          {/* Stats Section */}
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingTop={4}
            paddingBottom={2}
          >
            Stats
          </Text>
          <div className="perps-details-list">
            {/* 24h Volume Row */}
            <div
              className={`perps-details-list__row perps-details-list__row--first ${
                !market.openInterest && market.fundingRate === undefined
                  ? 'perps-details-list__row--last'
                  : ''
              }`}
            >
              <span className="perps-details-list__label">24h Volume</span>
              <span className="perps-details-list__value">{market.volume}</span>
            </div>

            {/* Open Interest Row */}
            {market.openInterest && (
              <div
                className={`perps-details-list__row ${
                  market.fundingRate === undefined
                    ? 'perps-details-list__row--last'
                    : ''
                }`}
              >
                <span className="perps-details-list__label">Open Interest</span>
                <span className="perps-details-list__value">
                  {market.openInterest}
                </span>
              </div>
            )}

            {/* Funding Rate Row */}
            {market.fundingRate !== undefined && (
              <div className="perps-details-list__row perps-details-list__row--last">
                <span className="perps-details-list__label">Funding Rate</span>
                <span
                  className={`perps-details-list__value ${
                    market.fundingRate >= 0
                      ? 'perps-details-list__value--long'
                      : 'perps-details-list__value--short'
                  }`}
                >
                  {(market.fundingRate * 100).toFixed(4)}%
                </span>
              </div>
            )}
          </div>

          {/* Recent Activity Section */}
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingTop={4}
            paddingBottom={2}
          >
            Recent Activity
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            style={{ gap: '1px' }}
          >
            {/* Activity Item 1 - Opened long */}
            <div
              className="perps-activity-item perps-activity-item--first"
              role="button"
              tabIndex={0}
            >
              <PerpsTokenLogo
                symbol={position.coin}
                size={AvatarTokenSize.Md}
              />
              <div className="perps-activity-item__left">
                <span className="perps-activity-item__action">Opened long</span>
                <span className="perps-activity-item__amount">
                  {Math.abs(parseFloat(position.size)).toFixed(5)} {displayName}
                </span>
              </div>
              <span className="perps-activity-item__pnl perps-activity-item__pnl--profit">
                +$125.00
              </span>
            </div>

            {/* Activity Item 2 - Increased position */}
            <div className="perps-activity-item" role="button" tabIndex={0}>
              <PerpsTokenLogo
                symbol={position.coin}
                size={AvatarTokenSize.Md}
              />
              <div className="perps-activity-item__left">
                <span className="perps-activity-item__action">
                  Increased position
                </span>
                <span className="perps-activity-item__amount">
                  0.50000 {displayName}
                </span>
              </div>
              <span className="perps-activity-item__pnl perps-activity-item__pnl--profit">
                +$45.20
              </span>
            </div>

            {/* Activity Item 3 - Closed short */}
            <div
              className="perps-activity-item perps-activity-item--last"
              role="button"
              tabIndex={0}
            >
              <PerpsTokenLogo
                symbol={position.coin}
                size={AvatarTokenSize.Md}
              />
              <div className="perps-activity-item__left">
                <span className="perps-activity-item__action">
                  Closed short
                </span>
                <span className="perps-activity-item__amount">
                  1.25000 {displayName}
                </span>
              </div>
              <span className="perps-activity-item__pnl perps-activity-item__pnl--loss">
                -$32.50
              </span>
            </div>
          </Box>

          {/* Learn Section */}
          <Box
            className="perps-position-detail-card perps-position-detail-card--pressable"
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            marginTop={4}
            role="button"
            tabIndex={0}
            onClick={() => {
              // TODO: Navigate to learn page
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // TODO: Navigate to learn page
              }
            }}
          >
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              Learn the basics of perps
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.iconAlternative}
            />
          </Box>

          {/* Disclaimer */}
          <Text
            variant={TextVariant.bodyXs}
            color={TextColor.textAlternative}
            paddingTop={4}
          >
            {t('perpsDisclaimer')}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PerpsMarketDetailPage;
