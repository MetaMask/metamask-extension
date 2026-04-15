import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import type { Order, Position } from '@metamask/perps-controller';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  selectPerpsIsFirstTimeUser,
  selectPerpsIsTestnet,
} from '../../../selectors/perps-controller';
import {
  selectTutorialCompleted,
  setTutorialModalOpen,
} from '../../../ducks/perps';

import { usePerpsEligibility } from '../../../hooks/perps';
import { usePerpsMeasurement } from '../../../hooks/perps/usePerpsMeasurement';

import { PerpsGeoBlockModal } from './perps-geo-block-modal';
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
  const dispatch = useDispatch();
  const isFirstTimeUser = useSelector(selectPerpsIsFirstTimeUser);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const tutorialCompleted = useSelector(selectTutorialCompleted);
  const { isEligible } = usePerpsEligibility();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const [isCloseAllPending, setIsCloseAllPending] = useState(false);
  const [isCancelAllPending, setIsCancelAllPending] = useState(false);
  const [batchActionError, setBatchActionError] = useState<string | null>(null);
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const { trigger: triggerWithdraw } = usePerpsWithdrawNavigation();

  // Stream hooks must run before any effects that touch PerpsStreamManager.
  // `usePerpsStreamManager` (inside these hooks) calls `perpsInit` then `init(address)`;
  // prewarm/init in an effect above these hooks used to run first and triggered
  // `perpsGetPositions` etc. before the background client existed (CLIENT_NOT_INITIALIZED).
  const { positions, isInitialLoading: positionsLoading } =
    usePerpsLivePositions();
  const { orders: allOrders, isInitialLoading: ordersLoading } =
    usePerpsLiveOrders();
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  const {
    transactions: allRecentActivityTransactions,
    isLoading: recentActivityLoading,
    error: recentActivityError,
  } = usePerpsTransactionHistory();

  // Recent Activity shows only trade executions, deposits, and withdrawals.
  // Open orders are already surfaced in PerpsPositionsOrders above.
  // Funding payments belong in the full activity page.
  const recentActivityTransactions = useMemo(
    () =>
      allRecentActivityTransactions.filter(
        (tx) =>
          tx.type === 'trade' ||
          tx.type === 'deposit' ||
          tx.type === 'withdrawal',
      ),
    [allRecentActivityTransactions],
  );

  // Show only user-placed limit orders resting on the orderbook.
  // Excludes:
  // - isTrigger: TP/SL trigger orders
  // - isSynthetic: synthetic/virtual orders not placed directly by the user
  const orders = useMemo(() => {
    return allOrders.filter(
      (order) =>
        order.status === 'open' && !order.isTrigger && !order.isSynthetic,
    );
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
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
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
  }, [isEligible, applyPositionsSnapshot, positions.length, t]);

  const handleCancelAllOrders = useCallback(async () => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
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
        const failureCount = result?.failureCount ?? 0;
        if (failureCount > 0 || result === undefined || result === null) {
          setBatchActionError(t('somethingWentWrong'));
          return;
        }
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
  }, [isEligible, applyOrdersSnapshot, orders.length, t]);

  const hasPositions = positions.length > 0;
  const isLoading = positionsLoading || ordersLoading || marketsLoading;

  usePerpsMeasurement('PerpsTabLoaded', !isLoading);

  // Auto-open tutorial modal the first time a user enters the perps domain.
  // Guards on both the backend isFirstTimeUser flag (stable once propagated) and
  // the local tutorialCompleted flag so that a skip/complete before the backend
  // state propagates doesn't reopen the modal on the next effect run.
  // Explicitly skips when isFirstTimeUser is undefined so that unhydrated
  // controller state is never treated as "first-time user = true".
  useEffect(() => {
    if (isLoading || tutorialCompleted || isFirstTimeUser === undefined) {
      return;
    }
    const networkKey = isTestnet ? 'testnet' : 'mainnet';
    if (isFirstTimeUser[networkKey]) {
      dispatch(setTutorialModalOpen(true));
    }
  }, [dispatch, isFirstTimeUser, isLoading, isTestnet, tutorialCompleted]);

  // Show loading state while initial stream data is being fetched.
  // Transaction history loads in parallel; Recent Activity skeleton is included here
  // so the section is represented before the main view mounts.
  if (isLoading) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        data-testid="perps-view-loading"
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
      data-testid="perps-view"
    >
      {/* Balance header with Add funds / Withdraw dropdown */}
      <PerpsBalanceDropdown
        hasPositions={hasPositions}
        onAddFunds={triggerDeposit}
        onWithdraw={triggerWithdraw}
      />

      {/* Positions + Orders sections */}
      {batchActionError ? (
        <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
          {batchActionError}
        </Text>
      ) : null}

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
      <PerpsExploreMarkets markets={allMarkets} />

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
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </Box>
  );
};

export default PerpsView;
