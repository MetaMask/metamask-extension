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
  const navigate = useNavigate();
  const hasPositions = mockPositions.length > 0;
  const hasOrders = mockOrders.length > 0;
  const hasNoPositionsOrOrders = !hasPositions && !hasOrders;

  const handleManageBalancePress = () => {
    navigate(PERPS_HOME_ROUTE);
  };

  const handleNewTrade = () => {
    navigate(PERPS_HOME_ROUTE);
  };

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
