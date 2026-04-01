import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import type { Order, Position } from '@metamask/perps-controller';
import React, { useCallback, useMemo, useState } from 'react';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
  usePerpsLiveMarketData,
} from '../../../hooks/perps/stream';
import { usePerpsTransactionHistory } from '../../../hooks/perps/usePerpsTransactionHistory';
import { PERPS_RECENT_ACTIVITY_MAX_TRANSACTIONS } from '../../../../shared/constants/perps';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import { getPerpsStreamManager } from '../../../providers/perps';

import { usePerpsDepositConfirmation } from './hooks/usePerpsDepositConfirmation';
import { usePerpsWithdrawNavigation } from './hooks/usePerpsWithdrawNavigation';
import { PerpsBalanceDropdown } from './perps-balance-dropdown';
import { PerpsExploreMarkets } from './perps-explore-markets';
import { PerpsPositionsOrders } from './perps-positions-orders';
import { PerpsRecentActivity } from './perps-recent-activity';
import {
  PerpsControlBarSkeleton,
  PerpsSectionSkeleton,
} from './perps-skeletons';
import { PerpsSupportLearn } from './perps-support-learn';
import { PerpsTutorialModal } from './perps-tutorial-modal';
import { PerpsWatchlist } from './perps-watchlist';

/**
 * PerpsView component displays the perpetuals trading view
 * with positions and orders sections using stream data.
 *
 * Uses PerpsStreamManager for cached data, enabling smooth navigation
 * without loading skeletons when switching between views.
 */
type BatchCloseResult = {
  success: boolean;
  successCount?: number;
  failureCount?: number;
};

export const PerpsView: React.FC = () => {
  const t = useI18nContext();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const [isCloseAllPending, setIsCloseAllPending] = useState(false);
  const [isCancelAllPending, setIsCancelAllPending] = useState(false);
  const [batchActionError, setBatchActionError] = useState<string | null>(null);
  const { trigger: triggerWithdraw } = usePerpsWithdrawNavigation();

  // Stream hooks must run before any effects that touch PerpsStreamManager.
  // `usePerpsStreamManager` (inside these hooks) calls `perpsInit` then `init(address)`;
  // prewarm/init in an effect above these hooks used to run first and triggered
  // `perpsGetPositions` etc. before the background client existed (CLIENT_NOT_INITIALIZED).
  const { positions, isInitialLoading: positionsLoading } =
    usePerpsLivePositions();
  const { orders: allOrders, isInitialLoading: ordersLoading } =
    usePerpsLiveOrders();
  const {
    cryptoMarkets: allCryptoMarkets,
    hip3Markets: allHip3Markets,
    isInitialLoading: marketsLoading,
  } = usePerpsLiveMarketData();

  const {
    transactions: recentActivityTransactions,
    isLoading: recentActivityLoading,
    error: recentActivityError,
  } = usePerpsTransactionHistory();

  // Show only user-placed limit orders resting on the orderbook.
  // Excludes all position-attached orders:
  // - isTrigger: TP/SL trigger orders
  // - reduceOnly: close/reduce orders tied to positions
  // - triggerPrice: any order with a trigger condition (TP/SL variant)
  // - detailedOrderType containing "Take Profit" or "Stop" (belt-and-suspenders)
  const orders = useMemo(() => {
    return allOrders.filter((order) => order.status === 'open');
  }, [allOrders]);

  const applyPositionsSnapshot = useCallback((next: Position[]) => {
    const streamManager = getPerpsStreamManager();
    streamManager.clearAllOptimisticTPSL();
    streamManager.pushPositionsWithOverrides(next);
  }, []);

  const applyOrdersSnapshot = useCallback((next: Order[]) => {
    getPerpsStreamManager().orders.pushData(next);
  }, []);

  const handleCloseAllPositions = useCallback(async () => {
    if (positions.length === 0) {
      return;
    }
    setBatchActionError(null);
    setIsCloseAllPending(true);
    try {
      const result = await submitRequestToBackground<BatchCloseResult>(
        'perpsClosePositions',
        [{ closeAll: true }],
      );
      if (!result?.success) {
        setBatchActionError(t('somethingWentWrong'));
        return;
      }
      const fresh = await submitRequestToBackground<Position[]>(
        'perpsGetPositions',
        [],
      );
      applyPositionsSnapshot(fresh ?? []);
    } catch {
      setBatchActionError(t('somethingWentWrong'));
    } finally {
      setIsCloseAllPending(false);
    }
  }, [applyPositionsSnapshot, positions.length, t]);

  const handleCancelAllOrders = useCallback(async () => {
    if (orders.length === 0) {
      return;
    }
    setBatchActionError(null);
    setIsCancelAllPending(true);
    try {
      const result = await submitRequestToBackground<BatchCloseResult>(
        'perpsCancelOrders',
        [{ cancelAll: true }],
      );
      if (!result?.success) {
        setBatchActionError(t('somethingWentWrong'));
        return;
      }
      const fresh = await submitRequestToBackground<Order[]>(
        'perpsGetOpenOrders',
        [],
      );
      applyOrdersSnapshot(fresh ?? []);
    } catch {
      setBatchActionError(t('somethingWentWrong'));
    } finally {
      setIsCancelAllPending(false);
    }
  }, [applyOrdersSnapshot, orders.length, t]);

  const hasPositions = positions.length > 0;
  const isLoading = positionsLoading || ordersLoading || marketsLoading;

  // Limit markets to 5 for explore sections
  const cryptoMarkets = useMemo(() => {
    return allCryptoMarkets.slice(0, 5);
  }, [allCryptoMarkets]);

  const hip3Markets = useMemo(() => {
    return allHip3Markets.slice(0, 5);
  }, [allHip3Markets]);

  // Show loading state while initial stream data is being fetched.
  // Transaction history loads in parallel; Recent Activity skeleton is included here
  // so the section is represented before the main view mounts.
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
        <Box data-testid="perps-recent-activity-skeleton">
          <PerpsSectionSkeleton cardCount={3} showStartTradeCta={false} />
        </Box>
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
        onWithdraw={triggerWithdraw}
      />

      {batchActionError ? (
        <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
          {batchActionError}
        </Text>
      ) : null}

      {/* Positions + Orders sections */}
      <PerpsPositionsOrders
        positions={positions}
        orders={orders}
        onCloseAllPositions={handleCloseAllPositions}
        onCancelAllOrders={handleCancelAllOrders}
        isCloseAllPending={isCloseAllPending}
        isCancelAllPending={isCancelAllPending}
      />

      {/* Watchlist */}
      <PerpsWatchlist />

      {/* Explore markets */}
      <PerpsExploreMarkets
        cryptoMarkets={cryptoMarkets}
        hip3Markets={hip3Markets}
      />

      {/* Recent Activity */}
      <PerpsRecentActivity
        transactions={recentActivityTransactions}
        maxTransactions={PERPS_RECENT_ACTIVITY_MAX_TRANSACTIONS}
        isLoading={recentActivityLoading}
        error={recentActivityError}
      />

      {/* Support & Learn */}
      <PerpsSupportLearn />
      {/* Tutorial Modal */}
      <PerpsTutorialModal />
    </Box>
  );
};

export default PerpsView;
