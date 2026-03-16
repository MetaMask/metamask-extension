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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PositionCard } from '../position-card';
import { OrderCard } from '../order-card';
import type { Position, Order } from '../types';

export type PerpsPositionsOrdersProps = {
  positions: Position[];
  orders: Order[];
};

export const PerpsPositionsOrders: React.FC<PerpsPositionsOrdersProps> = ({
  positions,
  orders,
}) => {
  const t = useI18nContext();
  const hasPositions = positions.length > 0;
  const hasOrders = orders.length > 0;

  if (!hasPositions && !hasOrders) {
    return null;
  }

  return (
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
            <Text fontWeight={FontWeight.Medium}>{t('perpsOpenOrders')}</Text>
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
  );
};
