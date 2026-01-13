import React from 'react';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextColor,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import { AvatarTokenSize, Box, Text } from '../../../component-library';
import { PerpsTokenLogo } from '../perps-token-logo';
import type { Order } from '../types';

export interface OrderCardProps {
  order: Order;
}

/**
 * Formats the order type for display (capitalizes first letter)
 */
const formatOrderType = (orderType: Order['orderType']): string => {
  return orderType.charAt(0).toUpperCase() + orderType.slice(1);
};

/**
 * Formats the order status for display (capitalizes first letter)
 */
const formatStatus = (status: Order['status']): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Extract display name from symbol (strips DEX prefix for HIP-3 markets)
 * e.g., "xyz:TSLA" -> "TSLA", "BTC" -> "BTC"
 */
const getDisplayName = (symbol: string): string => {
  const colonIndex = symbol.indexOf(':');
  if (colonIndex > 0 && colonIndex < symbol.length - 1) {
    return symbol.substring(colonIndex + 1);
  }
  return symbol;
};

/**
 * Get the appropriate text color for order status
 */
const getStatusColor = (status: Order['status']): TextColor => {
  switch (status) {
    case 'filled':
      return TextColor.successDefault;
    case 'canceled':
    case 'rejected':
      return TextColor.errorDefault;
    case 'open':
    case 'queued':
    case 'triggered':
    default:
      return TextColor.textAlternative;
  }
};

/**
 * OrderCard component displays individual order information
 * Two rows: symbol/type/side + size on left, price + status on right
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const isBuy = order.side === 'buy';
  const displayName = getDisplayName(order.symbol);

  return (
    <Box
      className="order-card"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={3}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
      data-testid={`order-card-${order.orderId}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={order.symbol}
        size={AvatarTokenSize.Md}
        className="order-card__logo"
      />

      {/* Left side: Symbol info and size */}
      <Box
        className="order-card__left"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        gap={1}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
        >
          <Text fontWeight={FontWeight.Medium}>{displayName}</Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {formatOrderType(order.orderType)} {isBuy ? 'buy' : 'sell'}
          </Text>
        </Box>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {order.size} {displayName}
        </Text>
      </Box>

      {/* Right side: Price and status */}
      <Box
        className="order-card__right"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        gap={1}
      >
        <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
          {order.orderType === 'limit' && order.price !== '0'
            ? `$${order.price}`
            : 'Market'}
        </Text>
        <Text variant={TextVariant.bodySm} color={getStatusColor(order.status)}>
          {formatStatus(order.status)}
        </Text>
      </Box>
    </Box>
  );
};

export default OrderCard;
