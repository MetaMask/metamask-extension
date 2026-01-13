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
  IconName,
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
import type { PerpsMarketData } from '../../components/app/perps/types';

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
      {/* Header with back button */}
      <Box
        paddingLeft={2}
        display={Display.Flex}
        paddingBottom={4}
        paddingTop={4}
        alignItems={AlignItems.center}
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
        <Text variant={TextVariant.headingMd} paddingLeft={2}>
          {displayName}
        </Text>
      </Box>

      {/* Market Info Section */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <Box>
            <Text
              variant={TextVariant.headingLg}
              fontWeight={FontWeight.Bold}
              data-testid="perps-market-detail-price"
            >
              {market.price}
            </Text>
            <Text
              variant={TextVariant.bodySm}
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
          <Box>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              Max Leverage: {market.maxLeverage}
            </Text>
          </Box>
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
            Your Position
          </Text>
          <PositionCard position={position} />
        </Box>
      )}

      {/* Orders Section */}
      {orders.length > 0 && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingBottom={2}
          >
            Open Orders ({orders.length})
          </Text>
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            {orders.map((order) => (
              <Box key={order.orderId} paddingBottom={2}>
                <OrderCard order={order} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Market Statistics Section */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Text
          variant={TextVariant.headingSm}
          fontWeight={FontWeight.Medium}
          paddingBottom={2}
        >
          Market Statistics
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              24h Volume
            </Text>
            <Text variant={TextVariant.bodySm}>{market.volume}</Text>
          </Box>
          {market.openInterest && (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
              paddingBottom={2}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                Open Interest
              </Text>
              <Text variant={TextVariant.bodySm}>{market.openInterest}</Text>
            </Box>
          )}
          {market.fundingRate !== undefined && (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                Funding Rate
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
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsMarketDetailPage;
