import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PERPS_HOME_ROUTE } from '../../../helpers/constants/routes';
import { PerpsControllerProvider } from '../../../providers/perps';
import {
  usePerpsLivePositions,
  usePerpsLiveOrders,
} from '../../../hooks/perps/stream';
import { PositionCard } from './position-card';
import { OrderCard } from './order-card';
import { PerpsTabControlBar } from './perps-tab-control-bar';
import { StartTradeCta } from './start-trade-cta';
import { PerpsEmptyState } from './perps-empty-state';

/**
 * Inner component that consumes controller hooks
 * Must be rendered within PerpsControllerProvider
 */
const PerpsTabViewContent: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  // Use stream hooks for real-time data
  const { positions, isInitialLoading: positionsLoading } =
    usePerpsLivePositions();
  const { orders, isInitialLoading: ordersLoading } = usePerpsLiveOrders();

  const hasPositions = positions.length > 0;
  const hasOrders = orders.length > 0;
  const hasNoPositionsOrOrders = !hasPositions && !hasOrders;
  const isLoading = positionsLoading || ordersLoading;

  const handleManageBalancePress = () => {
    navigate(PERPS_HOME_ROUTE);
  };

  const handleNewTrade = () => {
    navigate(PERPS_HOME_ROUTE);
  };

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        data-testid="perps-tab-view-loading"
      >
        <PerpsTabControlBar
          onManageBalancePress={handleManageBalancePress}
          hasPositions={false}
        />
        {/* Loading skeleton could be added here */}
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

      {/* Empty State */}
      {hasNoPositionsOrOrders && (
        <PerpsEmptyState onStartTrade={handleNewTrade} />
      )}

      {/* Positions Section */}
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
            <Text fontWeight={FontWeight.Medium}>{t('perpsPositions')}</Text>
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

      {/* Orders Section */}
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
            paddingTop={4}
            marginBottom={2}
          >
            <Text fontWeight={FontWeight.Medium}>{t('perpsOpenOrders')}</Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsCloseAll')}
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
  );
};

/**
 * PerpsTabView component displays the perpetuals trading tab
 * with positions and orders sections using stream data
 *
 * Wraps content with PerpsControllerProvider to enable controller hooks
 */
export const PerpsTabView: React.FC = () => {
  return (
    <PerpsControllerProvider>
      <PerpsTabViewContent />
    </PerpsControllerProvider>
  );
};

export default PerpsTabView;
