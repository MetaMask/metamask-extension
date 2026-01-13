import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Display,
  FlexDirection,
  IconColor,
  AlignItems,
  TextVariant,
  FontWeight,
  TextColor,
} from '../../helpers/constants/design-system';
import {
  AvatarTokenSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../helpers/constants/routes';
import {
  mockPositions,
  mockOrders,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../components/app/perps/mocks';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import { PerpsMarketBalanceActions } from '../../components/app/perps/perps-market-balance-actions';
import '../../components/app/perps/index.scss';

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
 * PerpsHomePage component
 * Main entry point for perps trading, showing market selection and account info
 * Accessible via /perps/home route
 */
const PerpsHomePage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  // Filter positions (only crypto for now, limit to 3)
  const positions = useMemo(() => {
    return mockPositions
      .filter((pos) => !pos.coin.includes(':'))
      .slice(0, 3);
  }, []);

  // Filter open orders (limit to 5)
  const openOrders = useMemo(() => {
    return mockOrders.filter((order) => order.status === 'open').slice(0, 5);
  }, []);

  // Filter crypto markets (limit to 5)
  const cryptoMarkets = useMemo(() => {
    return mockCryptoMarkets.slice(0, 5);
  }, []);

  // Filter HIP-3 markets (stocks and commodities, limit to 5)
  const hip3Markets = useMemo(() => {
    return mockHip3Markets.slice(0, 5);
  }, []);

  // Navigation handlers
  const handleBackClick = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleSearchClick = useCallback(() => {
    // TODO: Handle search
  }, []);

  const handlePositionClick = useCallback(
    (coin: string) => {
      navigate(`${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(coin)}`);
    },
    [navigate],
  );

  const handleMarketClick = useCallback(
    (symbol: string) => {
      navigate(`${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`);
    },
    [navigate],
  );

  return (
    <Box
      className="main-container asset__container"
      data-testid="perps-home-page"
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
          data-testid="perps-home-back-button"
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={handleBackClick}
        />

        {/* Title */}
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          style={{ flex: 1 }}
        >
          Perps
        </Text>

        {/* Search Icon */}
        <ButtonIcon
          data-testid="perps-home-search-button"
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="Search"
          iconName={IconName.Search}
          onClick={handleSearchClick}
        />
      </Box>

      {/* Balance Actions */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <PerpsMarketBalanceActions
          onAddFunds={() => {
            // TODO: Navigate to add funds flow
          }}
          onWithdraw={() => {
            // TODO: Navigate to withdraw flow
          }}
          onLearnMore={() => {
            // TODO: Navigate to learn more
          }}
        />
      </Box>

      {/* Section 1: Your positions */}
      {positions.length > 0 && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingBottom={2}
          >
            Your positions
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            style={{ gap: '1px' }}
          >
            {positions.map((position, index) => {
              const displaySymbol = getDisplayName(position.coin);
              const isLong = parseFloat(position.size) >= 0;
              const pnlValue = parseFloat(position.unrealizedPnl);
              const isProfit = pnlValue >= 0;

              return (
                <div
                  key={position.coin}
                  className={`perps-activity-item ${
                    positions.length === 1
                      ? 'perps-activity-item--first perps-activity-item--last'
                      : index === 0
                        ? 'perps-activity-item--first'
                        : index === positions.length - 1
                          ? 'perps-activity-item--last'
                          : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePositionClick(position.coin)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handlePositionClick(position.coin);
                    }
                  }}
                >
                  <PerpsTokenLogo
                    symbol={position.coin}
                    size={AvatarTokenSize.Md}
                  />
                  <div className="perps-activity-item__left">
                    <span className="perps-activity-item__action">
                      {displaySymbol} | {isLong ? 'Long' : 'Short'}
                    </span>
                    <span className="perps-activity-item__amount">
                      {Math.abs(parseFloat(position.size))} {displaySymbol}
                    </span>
                  </div>
                  <span
                    className={`perps-activity-item__pnl ${
                      isProfit
                        ? 'perps-activity-item__pnl--profit'
                        : 'perps-activity-item__pnl--loss'
                    }`}
                  >
                    {isProfit ? '+' : ''}${position.unrealizedPnl}
                  </span>
                </div>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Section 2: Your orders */}
      {openOrders.length > 0 && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Text
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Medium}
            paddingBottom={2}
          >
            Your orders
          </Text>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            style={{ gap: '1px' }}
          >
            {openOrders.map((order, index) => {
              const displaySymbol = getDisplayName(order.symbol);
              const orderTypeLabel =
                order.orderType === 'limit' ? 'Limit' : 'Market';
              const sideLabel = order.side === 'buy' ? 'buy' : 'sell';
              const orderValue =
                order.orderType === 'limit'
                  ? `$${(parseFloat(order.size) * parseFloat(order.price)).toFixed(2)}`
                  : '-';

              return (
                <div
                  key={order.orderId}
                  className={`perps-activity-item ${
                    openOrders.length === 1
                      ? 'perps-activity-item--first perps-activity-item--last'
                      : index === 0
                        ? 'perps-activity-item--first'
                        : index === openOrders.length - 1
                          ? 'perps-activity-item--last'
                          : ''
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <PerpsTokenLogo
                    symbol={order.symbol}
                    size={AvatarTokenSize.Md}
                  />
                  <div className="perps-activity-item__left">
                    <span className="perps-activity-item__action">
                      {displaySymbol} | {orderTypeLabel} {sideLabel}
                    </span>
                    <span className="perps-activity-item__amount">
                      {order.size} {displaySymbol}
                    </span>
                  </div>
                  <Text
                    variant={TextVariant.bodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {orderValue}
                  </Text>
                </div>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Section 3: Explore crypto */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Text
          variant={TextVariant.headingSm}
          fontWeight={FontWeight.Medium}
          paddingBottom={2}
        >
          Explore crypto
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{ gap: '1px' }}
        >
          {cryptoMarkets.map((market, index) => {
            const isPositiveChange = market.change24hPercent.startsWith('+');
            return (
              <div
                key={market.symbol}
                className="perps-activity-item"
                style={{
                  borderRadius:
                    cryptoMarkets.length === 1
                      ? '12px'
                      : index === 0
                        ? '12px 12px 0 0'
                        : index === cryptoMarkets.length - 1
                          ? '0 0 12px 12px'
                          : '0',
                }}
                role="button"
                tabIndex={0}
                onClick={() => handleMarketClick(market.symbol)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleMarketClick(market.symbol);
                  }
                }}
              >
                <PerpsTokenLogo
                  symbol={market.symbol}
                  size={AvatarTokenSize.Md}
                />
                <div className="perps-activity-item__left">
                  <span className="perps-activity-item__action">
                    {market.name}
                  </span>
                  <span className="perps-activity-item__amount">
                    {getDisplayName(market.symbol)}-USD
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
                    {market.price}
                  </Text>
                  <Text
                    variant={TextVariant.bodyXs}
                    color={
                      isPositiveChange
                        ? TextColor.successDefault
                        : TextColor.errorDefault
                    }
                  >
                    {market.change24hPercent}
                  </Text>
                </div>
              </div>
            );
          })}
        </Box>
      </Box>

      {/* Section 4: Explore stocks and commodities */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Text
          variant={TextVariant.headingSm}
          fontWeight={FontWeight.Medium}
          paddingBottom={2}
        >
          Explore stocks and commodities
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{ gap: '1px' }}
        >
          {hip3Markets.map((market, index) => {
            const isPositiveChange = market.change24hPercent.startsWith('+');
            return (
              <div
                key={market.symbol}
                className="perps-activity-item"
                style={{
                  borderRadius:
                    hip3Markets.length === 1
                      ? '12px'
                      : index === 0
                        ? '12px 12px 0 0'
                        : index === hip3Markets.length - 1
                          ? '0 0 12px 12px'
                          : '0',
                }}
                role="button"
                tabIndex={0}
                onClick={() => handleMarketClick(market.symbol)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleMarketClick(market.symbol);
                  }
                }}
              >
                <PerpsTokenLogo
                  symbol={market.symbol}
                  size={AvatarTokenSize.Md}
                />
                <div className="perps-activity-item__left">
                  <span className="perps-activity-item__action">
                    {market.name}
                  </span>
                  <span className="perps-activity-item__amount">
                    {getDisplayName(market.symbol)}-USD
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
                    {market.price}
                  </Text>
                  <Text
                    variant={TextVariant.bodyXs}
                    color={
                      isPositiveChange
                        ? TextColor.successDefault
                        : TextColor.errorDefault
                    }
                  >
                    {market.change24hPercent}
                  </Text>
                </div>
              </div>
            );
          })}
        </Box>
      </Box>

      {/* Section 5: Activity */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Text
          variant={TextVariant.headingSm}
          fontWeight={FontWeight.Medium}
          paddingBottom={2}
        >
          Activity
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
            <PerpsTokenLogo symbol="ETH" size={AvatarTokenSize.Md} />
            <div className="perps-activity-item__left">
              <span className="perps-activity-item__action">Opened long</span>
              <span className="perps-activity-item__amount">2.5 ETH</span>
            </div>
            <span className="perps-activity-item__pnl perps-activity-item__pnl--profit">
              +$125.00
            </span>
          </div>

          {/* Activity Item 2 - Closed short */}
          <div className="perps-activity-item" role="button" tabIndex={0}>
            <PerpsTokenLogo symbol="BTC" size={AvatarTokenSize.Md} />
            <div className="perps-activity-item__left">
              <span className="perps-activity-item__action">Closed short</span>
              <span className="perps-activity-item__amount">0.5 BTC</span>
            </div>
            <span className="perps-activity-item__pnl perps-activity-item__pnl--loss">
              -$32.50
            </span>
          </div>

          {/* Activity Item 3 - Increased position */}
          <div
            className="perps-activity-item perps-activity-item--last"
            role="button"
            tabIndex={0}
          >
            <PerpsTokenLogo symbol="SOL" size={AvatarTokenSize.Md} />
            <div className="perps-activity-item__left">
              <span className="perps-activity-item__action">
                Increased position
              </span>
              <span className="perps-activity-item__amount">50 SOL</span>
            </div>
            <span className="perps-activity-item__pnl perps-activity-item__pnl--profit">
              +$45.20
            </span>
          </div>
        </Box>
      </Box>

      {/* Support & Learn Section */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{ gap: '1px' }}
        >
          {/* Contact support */}
          <div
            className="perps-activity-item perps-activity-item--first"
            role="button"
            tabIndex={0}
            onClick={() => {
              // TODO: Navigate to support
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // TODO: Navigate to support
              }
            }}
            style={{ justifyContent: 'space-between' }}
          >
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              Contact support
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.iconAlternative}
            />
          </div>

          {/* Learn the basics of perps */}
          <div
            className="perps-activity-item perps-activity-item--last"
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
            style={{ justifyContent: 'space-between' }}
          >
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              Learn the basics of perps
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.iconAlternative}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsHomePage;

