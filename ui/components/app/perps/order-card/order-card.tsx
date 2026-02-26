import React, { useCallback, useMemo } from 'react';
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
import { useFormatters } from '../../../../hooks/useFormatters';
import { PerpsTokenLogo } from '../perps-token-logo';
import { formatOrderType, getDisplayName } from '../utils';
import type { Order } from '../types';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';

export type OrderCardProps = {
  order: Order;
  onClick?: (order: Order) => void;
  variant?: 'default' | 'muted';
};

/**
 * OrderCard component displays individual order information
 * Two rows: symbol/type/side + size on left, USD value + limit price on right
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
  const { formatCurrencyWithMinThreshold } = useFormatters();
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

  // Calculate order value in USD (size * price), formatted like position values
  const orderValueUsd = useMemo(() => {
    const size = parseFloat(order.size) || 0;
    const price = parseFloat(order.price) || 0;
    if (size > 0 && price > 0) {
      return formatCurrencyWithMinThreshold(size * price, 'USD');
    }
    return null;
  }, [order.size, order.price, formatCurrencyWithMinThreshold]);

  const baseStyles = 'cursor-pointer pt-2 pb-2 px-4 h-[62px]';
  const variantStyles =
    variant === 'muted'
      ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
      : 'bg-default hover:bg-hover active:bg-pressed';

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0',
        // Card styles (matches tokens tab: 62px height, 8px v-padding, 16px h-padding, 16px gap)
        'gap-4 text-left',
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
            {isBuy ? t('perpsLong') : t('perpsShort')}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {order.size} {displayName}
        </Text>
      </Box>

      {/* Right side: USD value + limit price */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {orderValueUsd ?? t('perpsMarket')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {formatOrderType(order.orderType)}
        </Text>
      </Box>
    </ButtonBase>
  );
};

export default OrderCard;
