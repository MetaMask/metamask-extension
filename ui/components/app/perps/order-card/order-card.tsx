import React, { useCallback } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getDisplayName,
  formatOrderType,
  formatStatus,
  getStatusColor,
} from '../utils';
import type { Order } from '../types';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';

export type OrderCardProps = {
  order: Order;
  onClick?: (order: Order) => void;
  variant?: 'default' | 'muted';
};

/**
 * OrderCard component displays individual order information
 * Two rows: symbol/type/side + size on left, price + status on right
 *
 * @param options0 - Component props
 * @param options0.order - The order data to display
 * @param options0.onClick - Optional click handler override. If not provided, navigates to market detail page.
 * @param options0.variant - Visual variant - 'default' for perps tab, 'muted' for detail page
 */
export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onClick,
  variant = 'default',
}) => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const isBuy = order.side === 'buy';
  const displayName = getDisplayName(order.symbol);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(order);
    } else {
      // TODO: Add Metrics tracking
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(order.symbol)}`,
      );
    }
  }, [navigate, order, onClick]);

  const baseStyles = 'cursor-pointer px-4 py-3';
  const variantStyles =
    variant === 'muted'
      ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
      : 'bg-default hover:bg-hover active:bg-pressed';

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0 h-auto',
        // Card styles
        'gap-3 text-left',
        baseStyles,
        variantStyles,
      )}
      isFullWidth
      onClick={handleClick}
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
    </ButtonBase>
  );
};

export default OrderCard;
