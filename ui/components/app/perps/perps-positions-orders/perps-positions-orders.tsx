import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PositionCard } from '../position-card';
import { OrderCard } from '../order-card';
import type { Position, Order } from '../types';

export type PerpsPositionsOrdersProps = {
  positions: Position[];
  orders: Order[];
  onCloseAllPositions?: () => void;
  onCancelAllOrders?: () => void;
  isCloseAllPending?: boolean;
  isCancelAllPending?: boolean;
};

export const PerpsPositionsOrders: React.FC<PerpsPositionsOrdersProps> = ({
  positions,
  orders,
  onCloseAllPositions,
  onCancelAllOrders,
  isCloseAllPending = false,
  isCancelAllPending = false,
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
            {/* TODO: TAT-2852 - Unhide when batch close/cancel is implemented */}
            {/* <ButtonBase
              size={ButtonBaseSize.Sm}
              disabled={isCloseAllPending || !onCloseAllPositions}
              onClick={onCloseAllPositions}
              data-testid="perps-close-all-positions"
              className="min-w-0 rounded-md border-0 bg-transparent px-1 py-0.5 -mr-1 shadow-none hover:bg-transparent active:bg-transparent focus-visible:bg-transparent disabled:opacity-50"
              textProps={{
                variant: TextVariant.BodySm,
                color: TextColor.TextAlternative,
              }}
            >
              {t('perpsCloseAll')}
            </ButtonBase> */}
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
            {/* TODO: TAT-2852 - Unhide when batch close/cancel is implemented */}
            {/* <ButtonBase
              size={ButtonBaseSize.Sm}
              disabled={isCancelAllPending || !onCancelAllOrders}
              onClick={onCancelAllOrders}
              data-testid="perps-cancel-all-orders"
              className="min-w-0 rounded-md border-0 bg-transparent px-1 py-0.5 -mr-1 shadow-none hover:bg-transparent active:bg-transparent focus-visible:bg-transparent disabled:opacity-50"
              textProps={{
                variant: TextVariant.BodySm,
                color: TextColor.TextAlternative,
              }}
            >
              {t('perpsCancelAllOrders')}
            </ButtonBase> */}
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
