import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getDisplayName,
  formatOrderType,
  formatStatus,
  getStatusColor,
} from '../utils';
import type { Order } from '../types';

export type OrderCardProps = {
  order: Order;
};

/**
 * OrderCard component displays individual order information
 * Two rows: symbol/type/side + size on left, price + status on right
 *
 * @param options0 - Component props
 * @param options0.order - The order data to display
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const t = useI18nContext();
  const isBuy = order.side === 'buy';
  const displayName = getDisplayName(order.symbol);

  return (
    <Box
      className="cursor-pointer bg-default px-4 py-3 hover:bg-hover active:bg-pressed"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
      data-testid={`order-card-${order.orderId}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={order.symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />

      {/* Left side: Symbol info and size */}
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <Text fontWeight={FontWeight.Medium}>{displayName}</Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {formatOrderType(order.orderType)}{' '}
            {isBuy ? t('perpsBuy') : t('perpsSell')}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {order.size} {displayName}
        </Text>
      </Box>

      {/* Right side: Price and status */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {order.orderType === 'limit' && order.price !== '0'
            ? `$${order.price}`
            : t('perpsMarket')}
        </Text>
        <Text variant={TextVariant.BodySm} color={getStatusColor(order.status)}>
          {formatStatus(order.status)}
        </Text>
      </Box>
    </Box>
  );
};

export default OrderCard;
