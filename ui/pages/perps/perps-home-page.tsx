import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { getIsPerpsEnabled } from '../../selectors/perps/feature-flags';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useFormatters } from '../../hooks/useFormatters';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../helpers/constants/routes';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveMarketData,
} from '../../hooks/perps/stream';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import { PerpsMarketBalanceActions } from '../../components/app/perps/perps-market-balance-actions';
import { getDisplayName } from '../../components/app/perps/utils';
import {
  PerpsBalanceActionsSkeleton,
  PerpsHomeCardSkeleton,
} from '../../components/app/perps/perps-skeletons';
import { Skeleton } from '../../components/component-library/skeleton';
import { PerpsTutorialModal } from '../../components/app/perps/perps-tutorial-modal';
import { setTutorialModalOpen } from '../../ducks/perps';

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
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isPerpsEnabled = useSelector(getIsPerpsEnabled);

  // Use stream hooks for real-time data
  const { positions: allPositions, isInitialLoading: positionsLoading } =
    usePerpsLivePositions();
  const { orders: allOrders, isInitialLoading: ordersLoading } =
    usePerpsLiveOrders();
  const {
    cryptoMarkets: allCryptoMarkets,
    hip3Markets: allHip3Markets,
    isInitialLoading: marketsLoading,
  } = usePerpsLiveMarketData();

  const isLoading = positionsLoading || ordersLoading || marketsLoading;

  // Filter positions (only crypto for now)
  const positions = useMemo(() => {
    return allPositions;
  }, [allPositions]);

  // Filter to user-placed limit orders resting on the orderbook.
  // Excludes position-attached orders (TP/SL triggers, reduce-only, etc.)
  const openOrders = useMemo(() => {
    return allOrders.filter((order) => order.status === 'open');
  }, [allOrders]);

  // Filter crypto markets (limit to 5)
  const cryptoMarkets = useMemo(() => {
    return allCryptoMarkets.slice(0, 5);
  }, [allCryptoMarkets]);

  // Filter HIP-3 markets (stocks and commodities, limit to 5)
  const hip3Markets = useMemo(() => {
    return allHip3Markets.slice(0, 5);
  }, [allHip3Markets]);

  // Navigation handlers
  const handleBackClick = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleSearchClick = useCallback(() => {
    navigate(PERPS_MARKET_LIST_ROUTE);
  }, [navigate]);

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

  const handleLearnPerps = useCallback(() => {
    dispatch(setTutorialModalOpen(true));
  }, [dispatch]);

  // Guard: redirect if perps feature is disabled
  if (!isPerpsEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

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
        {isLoading ? (
          <PerpsBalanceActionsSkeleton />
        ) : (
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
        )}
      </Box>

      {/* Loading skeletons for sections */}
      {isLoading && (
        <>
          {/* Positions skeleton */}
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <Box paddingBottom={2}>
              <Skeleton className="h-5 w-32" />
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Column}
              style={{ gap: '1px' }}
              className="rounded-xl overflow-hidden"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <PerpsHomeCardSkeleton key={`pos-skeleton-${index}`} />
              ))}
            </Box>
          </Box>

          {/* Crypto markets skeleton */}
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <Box paddingBottom={2}>
              <Skeleton className="h-5 w-28" />
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Column}
              style={{ gap: '1px' }}
              className="rounded-xl overflow-hidden"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <PerpsHomeCardSkeleton key={`crypto-skeleton-${index}`} />
              ))}
            </Box>
          </Box>

          {/* HIP-3 markets skeleton */}
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <Box paddingBottom={2}>
              <Skeleton className="h-5 w-40" />
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Column}
              style={{ gap: '1px' }}
              className="rounded-xl overflow-hidden"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <PerpsHomeCardSkeleton key={`hip3-skeleton-${index}`} />
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Section 1: Your positions */}
      {!isLoading && positions.length > 0 && (
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
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="cursor-pointer"
              // TODO: Handle close all positions
              // onClick={() => {
              // }}
            >
              {t('perpsCloseAll')}
            </Text>
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
            {positions.map((position) => {
              const displaySymbol = getDisplayName(position.symbol);
              const isLong = parseFloat(position.size) >= 0;
              const pnlValue = parseFloat(position.unrealizedPnl);
              const isProfit = pnlValue >= 0;
              const leverage = position.leverage?.value ?? 1;

              return (
                <Box
                  key={position.symbol}
                  className={`${LIST_ITEM_BASE} ${LIST_ITEM_RADIUS}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePositionClick(position.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handlePositionClick(position.symbol);
                    }
                  }}
                >
                  <PerpsTokenLogo
                    symbol={position.symbol}
                    size={AvatarTokenSize.Md}
                  />
                  <Box className="flex-1 min-w-0 flex flex-col gap-1">
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                    >
                      {displaySymbol} {leverage}x{' '}
                      {isLong ? t('perpsLong') : t('perpsShort')}
                    </Text>
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.TextAlternative}
                    >
                      {Math.abs(parseFloat(position.size))} {displaySymbol}
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
                      {formatCurrencyWithMinThreshold(
                        parseFloat(position.positionValue),
                        'USD',
                      )}
                    </Text>
                    <Text
                      variant={TextVariant.BodyXs}
                      color={
                        isProfit
                          ? TextColor.SuccessDefault
                          : TextColor.ErrorDefault
                      }
                    >
                      {isProfit ? '+' : ''}${position.unrealizedPnl}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Section 2: Your orders */}
      {!isLoading && openOrders.length > 0 && (
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
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="cursor-pointer"
              // onClick={() => {
              //   // TODO: Handle close all orders
              // }}
            >
              {t('perpsCloseAll')}
            </Text>
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} style={{ gap: '1px' }}>
            {openOrders.map((order) => {
              const displaySymbol = getDisplayName(order.symbol);
              const orderTypeLabel =
                order.orderType === 'limit'
                  ? t('perpsLimit')
                  : t('perpsMarket');
              const sideLabel =
                order.side === 'buy' ? t('perpsLong') : t('perpsShort');
              // Show limit price for limit orders, "Market" label for market orders
              const priceDisplay =
                order.orderType === 'limit' && order.price !== '0'
                  ? `$${order.price}`
                  : t('perpsMarket');

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
                  <Box
                    flexDirection={BoxFlexDirection.Column}
                    alignItems={BoxAlignItems.End}
                  >
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                    >
                      {priceDisplay}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Explore sections - hidden during loading */}
      {!isLoading && (
        <>
          {/* Section 3: Explore crypto */}
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
              paddingBottom={2}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={handleSearchClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSearchClick();
                }
              }}
            >
              <Text
                variant={TextVariant.HeadingSm}
                fontWeight={FontWeight.Medium}
              >
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
                const isPositiveChange =
                  market.change24hPercent.startsWith('+');
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
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={handleSearchClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSearchClick();
                }
              }}
            >
              <Text
                variant={TextVariant.HeadingSm}
                fontWeight={FontWeight.Medium}
              >
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
                const isPositiveChange =
                  market.change24hPercent.startsWith('+');
                const displaySymbol = getDisplayName(market.symbol);
                // Use getDisplayName on market.name to strip any DEX prefix
                const displayName = market.name
                  ? getDisplayName(market.name)
                  : displaySymbol;
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
                        {displayName}
                      </Text>
                      <Text
                        variant={TextVariant.BodyXs}
                        color={TextColor.TextAlternative}
                      >
                        {displaySymbol}-USD
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
        </>
      )}

      {/* Section 5: Activity */}
      {!isLoading && (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
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
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
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
      )}

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
                e.preventDefault();
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

          {/* Give us feedback */}
          <Box
            className={LIST_ITEM_BASE}
            role="button"
            tabIndex={0}
            onClick={() => {
              // TODO: Navigate to feedback page
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // TODO: Navigate to feedback page
              }
            }}
            justifyContent={BoxJustifyContent.Between}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('perpsGiveFeedback')}
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
            onClick={handleLearnPerps}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLearnPerps();
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

      {/* Tutorial Modal */}
      <PerpsTutorialModal />
    </Box>
  );
};

export default PerpsHomePage;
