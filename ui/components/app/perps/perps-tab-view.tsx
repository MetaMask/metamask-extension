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
import { useI18nContext } from '../../../hooks/useI18nContext';
import { mockPositions, mockOrders } from './mocks';
import { PositionCard } from './position-card';
import { OrderCard } from './order-card';
import { PerpsTabControlBar } from './perps-tab-control-bar';
import { StartTradeCta } from './start-trade-cta';
import { PerpsEmptyState } from './perps-empty-state';

/**
 * PerpsTabView component displays the perpetuals trading tab
 * with positions and orders sections using mock data
 */
export const PerpsTabView: React.FC = () => {
  const t = useI18nContext();
  const hasPositions = mockPositions.length > 0;
  const hasOrders = mockOrders.length > 0;
  const hasNoPositionsOrOrders = !hasPositions && !hasOrders;

  const handleManageBalancePress = () => {
    // TODO: Navigate to manage balance screen
    console.log('Navigate to manage balance');
  };

  const handleNewTrade = () => {
    // TODO: Navigate to trading view or tutorial for first-time users
    console.log('Navigate to new trade');
  };

  return (
    <Box
      className="perps-tab-view"
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
          className="perps-tab-view__section"
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-positions-section"
        >
          <Box
            className="perps-tab-view__section-header"
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
          <Box
            className="perps-tab-view__cards-container"
            flexDirection={BoxFlexDirection.Column}
            gap={2}
          >
            {mockPositions.map((position) => (
              <PositionCard key={position.coin} position={position} />
            ))}
          </Box>
          <StartTradeCta onPress={handleNewTrade} />
        </Box>
      )}

      {/* Orders Section */}
      {hasOrders && (
        <Box
          className="perps-tab-view__section"
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-orders-section"
        >
          <Box
            className="perps-tab-view__section-header"
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
          <Box
            className="perps-tab-view__cards-container"
            flexDirection={BoxFlexDirection.Column}
            gap={2}
          >
            {mockOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PerpsTabView;
