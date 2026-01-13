import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { AvatarTokenSize } from '../../../component-library';
import { PerpsTokenLogo } from '../perps-token-logo';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';
import type { Order } from '../types';

export interface OrderCardProps {
  order: Order;
  /** Optional click handler override. If not provided, navigates to market detail page. */
  onClick?: (order: Order) => void;
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
 * OrderCard component displays individual order information
 * Two rows: symbol/type/side + size on left, price + status on right
 * Clicking the card navigates to the market detail page for that symbol
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const navigate = useNavigate();
  const isBuy = order.side === 'buy';
  const displayName = getDisplayName(order.symbol);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(order);
    } else {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(order.symbol)}`,
      );
    }
  }, [navigate, order, onClick]);

  return (
    <div
      className="order-card order-card--clickable"
      data-testid={`order-card-${order.orderId}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={order.symbol}
        size={AvatarTokenSize.Md}
        className="order-card__logo"
      />

      {/* Left side: Symbol info and size */}
      <div className="order-card__left">
        <div className="order-card__header-row">
          <span className="order-card__symbol">{displayName}</span>
          <span className="order-card__type-side">
            {formatOrderType(order.orderType)} {isBuy ? 'buy' : 'sell'}
          </span>
        </div>
        <span className="order-card__size">
          {order.size} {displayName}
        </span>
      </div>

      {/* Right side: Price and status */}
      <div className="order-card__right">
        <span className="order-card__price">
          {order.orderType === 'limit' && order.price !== '0'
            ? `$${order.price}`
            : 'Market'}
        </span>
        <span
          className={classnames('order-card__status', {
            'order-card__status--filled': order.status === 'filled',
            'order-card__status--canceled': order.status === 'canceled',
            'order-card__status--rejected': order.status === 'rejected',
            'order-card__status--open': order.status === 'open',
            'order-card__status--queued': order.status === 'queued',
            'order-card__status--triggered': order.status === 'triggered',
          })}
        >
          {formatStatus(order.status)}
        </span>
      </div>
    </div>
  );
};

export default OrderCard;
