import React, { useMemo } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveMarketData,
} from '../../../hooks/perps/stream';
import { usePerpsDeposit } from '../../../hooks/perps';
import { PerpsBalanceDropdown } from './perps-balance-dropdown';
import { PerpsPositionsOrders } from './perps-positions-orders';
import { PerpsWatchlist } from './perps-watchlist';
import { PerpsExploreMarkets } from './perps-explore-markets';
import { PerpsRecentActivity } from './perps-recent-activity';
import { PerpsSupportLearn } from './perps-support-learn';
import { PerpsTutorialModal } from './perps-tutorial-modal';
import {
  PerpsControlBarSkeleton,
  PerpsSectionSkeleton,
} from './perps-skeletons';

/**
 * PerpsTabView component displays the perpetuals trading tab
 * with positions and orders sections using stream data.
 *
 * Uses PerpsStreamManager for cached data, enabling smooth navigation
 * without loading skeletons when switching between views.
 */
export const PerpsTabView: React.FC = () => {
  const { triggerDeposit } = usePerpsDeposit();

  // Use stream hooks for real-time data
  const { positions, isInitialLoading: positionsLoading } =
    usePerpsLivePositions();
  const { orders: allOrders, isInitialLoading: ordersLoading } =
    usePerpsLiveOrders();
  const {
    cryptoMarkets: allCryptoMarkets,
    hip3Markets: allHip3Markets,
    isInitialLoading: marketsLoading,
  } = usePerpsLiveMarketData();

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
  const isLoading = positionsLoading || ordersLoading || marketsLoading;

  // Limit markets to 5 for explore sections
  const cryptoMarkets = useMemo(() => {
    return allCryptoMarkets.slice(0, 5);
  }, [allCryptoMarkets]);

  const hip3Markets = useMemo(() => {
    return allHip3Markets.slice(0, 5);
  }, [allHip3Markets]);

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
      {/* Balance header with Add funds / Withdraw dropdown */}
      <PerpsBalanceDropdown
        hasPositions={hasPositions}
        onAddFunds={triggerDeposit}
        onWithdraw={() => {
          // TODO: Navigate to withdraw flow
        }}
      />

      {/* Positions + Orders sections */}
      <PerpsPositionsOrders positions={positions} orders={orders} />

      {/* Watchlist */}
      <PerpsWatchlist />

      {/* Explore markets */}
      <PerpsExploreMarkets
        cryptoMarkets={cryptoMarkets}
        hip3Markets={hip3Markets}
      />

      {/* Recent Activity */}
      <PerpsRecentActivity />

      {/* Support & Learn */}
      <PerpsSupportLearn />
      {/* Tutorial Modal */}
      <PerpsTutorialModal />
    </Box>
  );
};

export default PerpsTabView;
