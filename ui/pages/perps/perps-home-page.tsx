import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvatarTokenSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  IconColor,
  TextVariant,
  FontWeight,
  TextColor,
} from '@metamask/design-system-react';
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
import { getDisplayName } from '../../components/app/perps/utils';

/**
 * Get CSS class modifier for list item based on position in list
 *
 * @param index - Current item index
 * @param totalLength - Total number of items in list
 * @returns CSS class modifier string
 */
const getListItemPositionClass = (
  index: number,
  totalLength: number,
): string => {
  if (totalLength === 1) {
    return 'perps-activity-item--first perps-activity-item--last';
  }
  if (index === 0) {
    return 'perps-activity-item--first';
  }
  if (index === totalLength - 1) {
    return 'perps-activity-item--last';
  }
  return '';
};

/**
 * Get border radius style for list item based on position in list
 *
 * @param index - Current item index
 * @param totalLength - Total number of items in list
 * @returns Border radius CSS value
 */
const getListItemBorderRadius = (
  index: number,
  totalLength: number,
): string => {
  if (totalLength === 1) {
    return '12px';
  }
  if (index === 0) {
    return '12px 12px 0 0';
  }
  if (index === totalLength - 1) {
    return '0 0 12px 12px';
  }
  return '0';
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
    return mockPositions.filter((pos) => !pos.coin.includes(':')).slice(0, 3);
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
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
        gap={2}
      >
        {/* Back Button */}
        <ButtonIcon
          data-testid="perps-home-back-button"
          color={IconColor.IconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={handleBackClick}
        />

        {/* Title */}
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          style={{ flex: 1 }}
        >
          {t('perps')}
        </Text>

        {/* Search Icon */}
        <ButtonIcon
          data-testid="perps-home-search-button"
          color={IconColor.IconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel={t('search')}
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
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsYourPositions')}
            </Text>
            <ButtonIcon
              color={IconColor.IconAlternative}
              size={ButtonIconSize.Sm}
              ariaLabel={t('perpsPositions')}
              iconName={IconName.MoreHorizontal}
              onClick={() => {
                // TODO: Handle positions menu
              }}
            />
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
            {positions.map((position, index) => {
              const displaySymbol = getDisplayName(position.coin);
              const isLong = parseFloat(position.size) >= 0;
              const pnlValue = parseFloat(position.unrealizedPnl);
              const isProfit = pnlValue >= 0;

              return (
                <Box
                  key={position.coin}
                  className={`perps-activity-item ${getListItemPositionClass(index, positions.length)}`}
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
                  <Box className="perps-activity-item__left">
                    <Text className="perps-activity-item__action">
                      {displaySymbol} |{' '}
                      {isLong ? t('perpsLong') : t('perpsShort')}
                    </Text>
                    <Text className="perps-activity-item__amount">
                      {Math.abs(parseFloat(position.size))} {displaySymbol}
                    </Text>
                  </Box>
                  <Text
                    className={`perps-activity-item__pnl ${
                      isProfit
                        ? 'perps-activity-item__pnl--profit'
                        : 'perps-activity-item__pnl--loss'
                    }`}
                  >
                    {isProfit ? '+' : ''}${position.unrealizedPnl}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Section 2: Your orders */}
      {openOrders.length > 0 && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsYourOrders')}
            </Text>
            <ButtonIcon
              color={IconColor.IconAlternative}
              size={ButtonIconSize.Sm}
              ariaLabel={t('perpsOrders')}
              iconName={IconName.MoreHorizontal}
              onClick={() => {
                // TODO: Handle orders menu
              }}
            />
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
            {openOrders.map((order, index) => {
              const displaySymbol = getDisplayName(order.symbol);
              const orderTypeLabel =
                order.orderType === 'limit'
                  ? t('perpsLimit')
                  : t('perpsMarket');
              const sideLabel =
                order.side === 'buy' ? t('perpsBuy') : t('perpsSell');
              const orderValue =
                order.orderType === 'limit'
                  ? `$${(parseFloat(order.size) * parseFloat(order.price)).toFixed(2)}`
                  : '-';

              return (
                <Box
                  key={order.orderId}
                  className={`perps-activity-item ${getListItemPositionClass(index, openOrders.length)}`}
                  role="button"
                  tabIndex={0}
                >
                  <PerpsTokenLogo
                    symbol={order.symbol}
                    size={AvatarTokenSize.Md}
                  />
                  <Box className="perps-activity-item__left">
                    <Text className="perps-activity-item__action">
                      {displaySymbol} | {orderTypeLabel} {sideLabel}
                    </Text>
                    <Text className="perps-activity-item__amount">
                      {order.size} {displaySymbol}
                    </Text>
                  </Box>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {orderValue}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Section 3: Explore crypto */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          paddingBottom={2}
        >
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
            {t('perpsExploreCrypto')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
          {cryptoMarkets.map((market, index) => {
            const isPositiveChange = market.change24hPercent.startsWith('+');
            return (
              <Box
                key={market.symbol}
                className="perps-activity-item"
                style={{
                  borderRadius: getListItemBorderRadius(
                    index,
                    cryptoMarkets.length,
                  ),
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
                <Box className="perps-activity-item__left">
                  <Text className="perps-activity-item__action">
                    {market.name}
                  </Text>
                  <Text className="perps-activity-item__amount">
                    {getDisplayName(market.symbol)}-USD
                  </Text>
                </Box>
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.End}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
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
                  >
                    {market.change24hPercent}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Section 4: Explore stocks and commodities */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          paddingBottom={2}
        >
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
            {t('perpsExploreStocksAndCommodities')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
          {hip3Markets.map((market, index) => {
            const isPositiveChange = market.change24hPercent.startsWith('+');
            return (
              <Box
                key={market.symbol}
                className="perps-activity-item"
                style={{
                  borderRadius: getListItemBorderRadius(
                    index,
                    hip3Markets.length,
                  ),
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
                <Box className="perps-activity-item__left">
                  <Text className="perps-activity-item__action">
                    {market.name}
                  </Text>
                  <Text className="perps-activity-item__amount">
                    {getDisplayName(market.symbol)}-USD
                  </Text>
                </Box>
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.End}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
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
                  >
                    {market.change24hPercent}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Section 5: Activity */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          paddingBottom={2}
        >
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Medium}>
            {t('perpsActivity')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
          {/* Activity Item 1 - Opened long */}
          <Box
            className="perps-activity-item perps-activity-item--first"
            role="button"
            tabIndex={0}
          >
            <PerpsTokenLogo symbol="ETH" size={AvatarTokenSize.Md} />
            <Box className="perps-activity-item__left">
              <Text className="perps-activity-item__action">
                {t('perpsOpenedLong')}
              </Text>
              <Text className="perps-activity-item__amount">2.5 ETH</Text>
            </Box>
            <Text className="perps-activity-item__pnl perps-activity-item__pnl--profit">
              +$125.00
            </Text>
          </Box>

          {/* Activity Item 2 - Closed short */}
          <Box className="perps-activity-item" role="button" tabIndex={0}>
            <PerpsTokenLogo symbol="BTC" size={AvatarTokenSize.Md} />
            <Box className="perps-activity-item__left">
              <Text className="perps-activity-item__action">
                {t('perpsClosedShort')}
              </Text>
              <Text className="perps-activity-item__amount">0.5 BTC</Text>
            </Box>
            <Text className="perps-activity-item__pnl perps-activity-item__pnl--loss">
              -$32.50
            </Text>
          </Box>

          {/* Activity Item 3 - Increased position */}
          <Box
            className="perps-activity-item perps-activity-item--last"
            role="button"
            tabIndex={0}
          >
            <PerpsTokenLogo symbol="SOL" size={AvatarTokenSize.Md} />
            <Box className="perps-activity-item__left">
              <Text className="perps-activity-item__action">
                {t('perpsIncreasedPosition')}
              </Text>
              <Text className="perps-activity-item__amount">50 SOL</Text>
            </Box>
            <Text className="perps-activity-item__pnl perps-activity-item__pnl--profit">
              +$45.20
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Support & Learn Section */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
          {/* Contact support */}
          <Box
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
            justifyContent={BoxJustifyContent.Between}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('perpsContactSupport')}
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>

          {/* Learn the basics of perps */}
          <Box
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
            justifyContent={BoxJustifyContent.Between}
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
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsHomePage;
