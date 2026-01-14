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
import { PerpsTokenLogo } from '../perps-token-logo';
import type { Order } from '../types';

export type OrderCardProps = {
  order: Order;
};

/**
 * Formats the order type for display (capitalizes first letter)
 *
 * @param orderType - The order type to format
 * @returns The formatted order type
 * @example
 * formatOrderType('market') => 'Market'
 * formatOrderType('limit') => 'Limit'
 */
const formatOrderType = (orderType: Order['orderType']): string => {
  return orderType.charAt(0).toUpperCase() + orderType.slice(1);
};

/**
 * Formats the order status for display (capitalizes first letter)
 *
 * @param status - The order status to format
 * @returns The formatted order status
 * @example
 * formatStatus('open') => 'Open'
 * formatStatus('filled') => 'Filled'
 * formatStatus('canceled') => 'Canceled'
 * formatStatus('rejected') => 'Rejected'
 * formatStatus('queued') => 'Queued'
 * formatStatus('triggered') => 'Triggered'
 */
const formatStatus = (status: Order['status']): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Extract display name from symbol (strips DEX prefix for HIP-3 markets)
 * e.g., "xyz:TSLA" -> "TSLA", "BTC" -> "BTC"
 *
 * @param symbol - The symbol to extract the display name from
 * @returns The display name
 * @example
 * getDisplayName('xyz:TSLA') => 'TSLA'
 * getDisplayName('BTC') => 'BTC'
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
 *
 * @param status - The order status to get the color for
 * @returns The appropriate text color
 * @example
 * getStatusColor('open') => TextColor.TextAlternative
 * getStatusColor('filled') => TextColor.SuccessDefault
 * getStatusColor('canceled') => TextColor.ErrorDefault
 * getStatusColor('rejected') => TextColor.ErrorDefault
 * getStatusColor('queued') => TextColor.TextAlternative
 * getStatusColor('triggered') => TextColor.TextAlternative
 */
const getStatusColor = (status: Order['status']): TextColor => {
  switch (status) {
    case 'filled':
      return TextColor.SuccessDefault;
    case 'canceled':
    case 'rejected':
      return TextColor.ErrorDefault;
    case 'open':
    case 'queued':
    case 'triggered':
    default:
      return TextColor.TextAlternative;
  }
};

/**
 * OrderCard component displays individual order information
 * Two rows: symbol/type/side + size on left, price + status on right
 *
 * @param options0 - Component props
 * @param options0.order - The order data to display
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const isBuy = order.side === 'buy';
  const displayName = getDisplayName(order.symbol);

  return (
    <Box
      className="order-card"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
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
        className="order-card__left flex-1 min-w-0"
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
            {formatOrderType(order.orderType)} {isBuy ? 'buy' : 'sell'}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {order.size} {displayName}
        </Text>
      </Box>

      {/* Right side: Price and status */}
      <Box
        className="order-card__right"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {order.orderType === 'limit' && order.price !== '0'
            ? `$${order.price}`
            : 'Market'}
        </Text>
        <Text variant={TextVariant.BodySm} color={getStatusColor(order.status)}>
          {formatStatus(order.status)}
        </Text>
      </Box>
    </Box>
  );
};

export default OrderCard;
