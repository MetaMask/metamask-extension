import React, { useMemo, useCallback, useEffect } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  PERPS_HOME_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../../helpers/constants/routes';
import { getPerpsStreamManager } from '../../../providers/perps';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveMarketData,
} from '../../../hooks/perps/stream';
import { PositionCard } from './position-card';
import { OrderCard } from './order-card';
import { PerpsTabControlBar } from './perps-tab-control-bar';
import { StartTradeCta } from './start-trade-cta';
import { PerpsRecentActivity } from './perps-recent-activity';
import { PerpsTokenLogo } from './perps-token-logo';
import { getDisplayName } from './utils';
import {
  PerpsControlBarSkeleton,
  PerpsSectionSkeleton,
} from './perps-skeletons';

// Card styles matching PositionCard (aligns with tokens tab: 62px height, 8px v-padding, 16px h-padding, 16px gap)
const CARD_STYLES =
  'justify-start rounded-none min-w-0 h-[62px] gap-4 text-left cursor-pointer bg-default pt-2 pb-2 px-4 hover:bg-hover active:bg-pressed';

/**
 * PerpsTabView component displays the perpetuals trading tab
 * with positions and orders sections using stream data.
 *
 * Uses PerpsStreamManager for cached data, enabling smooth navigation
 * without loading skeletons when switching between views.
 */
export const PerpsTabView: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  // Get selected address for stream manager initialization
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  // Initialize stream manager and prewarm on mount
  useEffect(() => {
    if (!selectedAddress) {
      return;
    }

    const streamManager = getPerpsStreamManager();

    // Initialize and prewarm
    streamManager.init(selectedAddress).then(() => {
      streamManager.prewarm();
    });

    // Cleanup prewarm on unmount (cache persists!)
    return () => {
      streamManager.cleanupPrewarm();
    };
  }, [selectedAddress]);

  // Use stream hooks for real-time data
  const { positions, isInitialLoading: positionsLoading } =
    usePerpsLivePositions();
  const { orders: allOrders, isInitialLoading: ordersLoading } =
    usePerpsLiveOrders();
  const { cryptoMarkets: allCryptoMarkets, hip3Markets: allHip3Markets } =
    usePerpsLiveMarketData();

  // Show only user-placed limit orders resting on the orderbook.
  // Excludes all position-attached orders:
  // - isTrigger: TP/SL trigger orders
  // - reduceOnly: close/reduce orders tied to positions
  // - triggerPrice: any order with a trigger condition (TP/SL variant)
  // - detailedOrderType containing "Take Profit" or "Stop" (belt-and-suspenders)
  const orders = useMemo(() => {
    return allOrders.filter((order) => order.status === 'open');
  }, [allOrders]);

  const hasPositions = positions.length > 0;
  const hasOrders = orders.length > 0;
  const isLoading = positionsLoading || ordersLoading;

  // Limit markets to 5 for explore sections
  const cryptoMarkets = useMemo(() => {
    return allCryptoMarkets.slice(0, 5);
  }, [allCryptoMarkets]);

  const hip3Markets = useMemo(() => {
    return allHip3Markets.slice(0, 5);
  }, [allHip3Markets]);

  const handleManageBalancePress = useCallback(() => {
    navigate(PERPS_HOME_ROUTE);
  }, [navigate]);

  const handleNewTrade = useCallback(() => {
    navigate(PERPS_HOME_ROUTE);
  }, [navigate]);

  const handleMarketClick = useCallback(
    (symbol: string) => {
      navigate(`${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`);
    },
    [navigate],
  );

  const handleSeeAllPerps = useCallback(() => {
    navigate(PERPS_MARKET_LIST_ROUTE);
  }, [navigate]);

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        data-testid="perps-tab-view-loading"
      >
        <PerpsControlBarSkeleton />
        <PerpsSectionSkeleton cardCount={5} showStartTradeCta />
        <PerpsSectionSkeleton cardCount={5} />
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      data-testid="perps-tab-view"
    >
      {/* Control Bar with Balance and P&L */}
      <PerpsTabControlBar
        onManageBalancePress={handleManageBalancePress}
        hasPositions={hasPositions}
      />

      {/* Explore Sections - shown when no positions */}
      {!hasPositions && (
        <>
          {/* Explore Crypto Section */}
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={2}
            data-testid="perps-explore-crypto-section"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={4}
              marginBottom={2}
            >
              <Text fontWeight={FontWeight.Medium}>
                {t('perpsExploreCrypto')}
              </Text>
            </Box>
            <Box flexDirection={BoxFlexDirection.Column}>
              {cryptoMarkets.map((market) => {
                const isPositiveChange =
                  market.change24hPercent.startsWith('+');
                return (
                  <ButtonBase
                    key={market.symbol}
                    className={twMerge(CARD_STYLES)}
                    isFullWidth
                    onClick={() => handleMarketClick(market.symbol)}
                    data-testid={`explore-crypto-${market.symbol}`}
                  >
                    <PerpsTokenLogo
                      symbol={market.symbol}
                      size={AvatarTokenSize.Md}
                      className="shrink-0"
                    />
                    <Box
                      className="min-w-0 flex-1"
                      flexDirection={BoxFlexDirection.Column}
                      alignItems={BoxAlignItems.Start}
                      gap={1}
                    >
                      <Text fontWeight={FontWeight.Medium}>{market.name}</Text>
                      <Text
                        variant={TextVariant.BodySm}
                        color={TextColor.TextAlternative}
                      >
                        {getDisplayName(market.symbol)}-USD
                      </Text>
                    </Box>
                    <Box
                      className="shrink-0"
                      flexDirection={BoxFlexDirection.Column}
                      alignItems={BoxAlignItems.End}
                      gap={1}
                    >
                      <Text
                        variant={TextVariant.BodySm}
                        fontWeight={FontWeight.Medium}
                      >
                        {market.price}
                      </Text>
                      <Text
                        variant={TextVariant.BodySm}
                        color={
                          isPositiveChange
                            ? TextColor.SuccessDefault
                            : TextColor.ErrorDefault
                        }
                      >
                        {market.change24hPercent}
                      </Text>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>

          {/* Explore Stocks and Commodities Section */}
          {hip3Markets.length > 0 && (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={2}
              data-testid="perps-explore-hip3-section"
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingLeft={4}
                paddingRight={4}
                paddingTop={4}
                marginBottom={2}
              >
                <Text fontWeight={FontWeight.Medium}>
                  {t('perpsExploreStocksAndCommodities')}
                </Text>
              </Box>
              <Box flexDirection={BoxFlexDirection.Column}>
                {hip3Markets.map((market) => {
                  const isPositiveChange =
                    market.change24hPercent.startsWith('+');
                  const displaySymbol = getDisplayName(market.symbol);
                  const displayName = market.name
                    ? getDisplayName(market.name)
                    : displaySymbol;
                  return (
                    <ButtonBase
                      key={market.symbol}
                      className={twMerge(CARD_STYLES)}
                      isFullWidth
                      onClick={() => handleMarketClick(market.symbol)}
                      data-testid={`explore-hip3-${market.symbol.replace(/:/gu, '-')}`}
                    >
                      <PerpsTokenLogo
                        symbol={market.symbol}
                        size={AvatarTokenSize.Md}
                        className="shrink-0"
                      />
                      <Box
                        className="min-w-0 flex-1"
                        flexDirection={BoxFlexDirection.Column}
                        alignItems={BoxAlignItems.Start}
                        gap={1}
                      >
                        <Text fontWeight={FontWeight.Medium}>
                          {displayName}
                        </Text>
                        <Text
                          variant={TextVariant.BodySm}
                          color={TextColor.TextAlternative}
                        >
                          {displaySymbol}-USD
                        </Text>
                      </Box>
                      <Box
                        className="shrink-0"
                        flexDirection={BoxFlexDirection.Column}
                        alignItems={BoxAlignItems.End}
                        gap={1}
                      >
                        <Text
                          variant={TextVariant.BodySm}
                          fontWeight={FontWeight.Medium}
                        >
                          {market.price}
                        </Text>
                        <Text
                          variant={TextVariant.BodySm}
                          color={
                            isPositiveChange
                              ? TextColor.SuccessDefault
                              : TextColor.ErrorDefault
                          }
                        >
                          {market.change24hPercent}
                        </Text>
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* See All Perps CTA */}
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
            paddingBottom={2}
          >
            <ButtonBase
              className="w-full justify-center rounded-xl bg-muted py-3 hover:bg-muted-hover active:bg-muted-pressed"
              onClick={handleSeeAllPerps}
              data-testid="see-all-perps-cta"
            >
              <Text fontWeight={FontWeight.Medium}>
                {t('perpsSeeAllPerps')}
              </Text>
            </ButtonBase>
          </Box>
        </>
      )}

      {/* Positions + Orders sections - tighter gap between them when both shown */}
      {(hasPositions || hasOrders) && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-positions-orders-section"
        >
          {hasPositions && (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={2}
              data-testid="perps-positions-section"
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingLeft={4}
                paddingRight={4}
                paddingTop={4}
                marginBottom={2}
              >
                <Text fontWeight={FontWeight.Medium}>
                  {t('perpsPositions')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsCloseAll')}
                </Text>
              </Box>
              <Box flexDirection={BoxFlexDirection.Column}>
                {positions.map((position) => (
                  <PositionCard key={position.symbol} position={position} />
                ))}
              </Box>
              <StartTradeCta onPress={handleNewTrade} />
            </Box>
          )}

          {hasOrders && (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={2}
              data-testid="perps-orders-section"
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingLeft={4}
                paddingRight={4}
                paddingTop={hasPositions ? 0 : 4}
                marginBottom={2}
              >
                <Text fontWeight={FontWeight.Medium}>
                  {t('perpsOpenOrders')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsCancelAllOrders')}
                </Text>
              </Box>
              <Box flexDirection={BoxFlexDirection.Column}>
                {orders.map((order) => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Recent Activity Section - only shown when user has positions */}
      {hasPositions && <PerpsRecentActivity />}
    </Box>
  );
};

export default PerpsTabView;
