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

// Tailwind classes for list item styling
const LIST_ITEM_BASE =
  'flex items-center gap-3 px-4 py-3 bg-background-muted cursor-pointer hover:bg-hover active:bg-pressed';
const LIST_ITEM_RADIUS =
  'rounded-none first:rounded-t-xl last:rounded-b-xl only:rounded-xl';

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
                  className={`${LIST_ITEM_BASE} ${LIST_ITEM_RADIUS}`}
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
                  <Box className="flex-1 min-w-0 flex flex-col gap-1">
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                    >
                      {displaySymbol} |{' '}
                      {isLong ? t('perpsLong') : t('perpsShort')}
                    </Text>
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.TextAlternative}
                    >
                      {Math.abs(parseFloat(position.size))} {displaySymbol}
                    </Text>
                  </Box>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    color={
                      isProfit
                        ? TextColor.SuccessDefault
                        : TextColor.ErrorDefault
                    }
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
                  className={`${LIST_ITEM_BASE} ${LIST_ITEM_RADIUS}`}
                  role="button"
                  tabIndex={0}
                >
                  <PerpsTokenLogo
                    symbol={order.symbol}
                    size={AvatarTokenSize.Md}
                  />
                  <Box className="flex-1 min-w-0 flex flex-col gap-1">
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                    >
                      {displaySymbol} | {orderTypeLabel} {sideLabel}
                    </Text>
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.TextAlternative}
                    >
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
          {cryptoMarkets.map((market) => {
            const isPositiveChange = market.change24hPercent.startsWith('+');
            return (
              <Box
                key={market.symbol}
                className={`${LIST_ITEM_BASE} ${LIST_ITEM_RADIUS}`}
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
                <Box className="flex-1 min-w-0 flex flex-col gap-1">
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {market.name}
                  </Text>
                  <Text
                    variant={TextVariant.BodyXs}
                    color={TextColor.TextAlternative}
                  >
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
          {hip3Markets.map((market) => {
            const isPositiveChange = market.change24hPercent.startsWith('+');
            return (
              <Box
                key={market.symbol}
                className={`${LIST_ITEM_BASE} ${LIST_ITEM_RADIUS}`}
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
                <Box className="flex-1 min-w-0 flex flex-col gap-1">
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {market.name}
                  </Text>
                  <Text
                    variant={TextVariant.BodyXs}
                    color={TextColor.TextAlternative}
                  >
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
            className={`${LIST_ITEM_BASE} rounded-t-xl`}
            role="button"
            tabIndex={0}
          >
            <PerpsTokenLogo symbol="ETH" size={AvatarTokenSize.Md} />
            <Box className="flex-1 min-w-0 flex flex-col gap-1">
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {t('perpsOpenedLong')}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                2.5 ETH
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

          {/* Activity Item 2 - Closed short */}
          <Box className={LIST_ITEM_BASE} role="button" tabIndex={0}>
            <PerpsTokenLogo symbol="BTC" size={AvatarTokenSize.Md} />
            <Box className="flex-1 min-w-0 flex flex-col gap-1">
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {t('perpsClosedShort')}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                0.5 BTC
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

          {/* Activity Item 3 - Increased position */}
          <Box
            className={`${LIST_ITEM_BASE} rounded-b-xl`}
            role="button"
            tabIndex={0}
          >
            <PerpsTokenLogo symbol="SOL" size={AvatarTokenSize.Md} />
            <Box className="flex-1 min-w-0 flex flex-col gap-1">
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {t('perpsIncreasedPosition')}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                50 SOL
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
        </Box>
      </Box>

      {/* Support & Learn Section */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
          {/* Contact support */}
          <Box
            className={`${LIST_ITEM_BASE} rounded-t-xl`}
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
            className={`${LIST_ITEM_BASE} rounded-b-xl`}
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
