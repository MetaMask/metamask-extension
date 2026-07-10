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
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsPerpsShowFullAssetNamesEnabled } from '../../../../selectors/perps/feature-flags';
import { PerpsTokenLogo } from '../perps-token-logo';
import { formatPerpsFiatUniversal } from '../utils/formatPerpsDisplayPrice';
import { getDisplayName } from '../utils';
import { formatOrderLabel } from '../utils/orderUtils';
import type { Order } from '../types';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';

export type OrderCardProps = {
  order: Order;
  onClick?: (order: Order) => void;
  variant?: 'default' | 'muted';
  /** Full asset name (e.g. 'Bitcoin'); falls back to the ticker when omitted */
  assetName?: string;
};

/**
 * OrderCard component displays individual order information
 * Two rows on the left: symbol + order label (TP/SL: label only; symbol follows size below),
 * trigger or notional value on the right
 *
 * @param options0 - Component props
 * @param options0.order - The order data to display
 * @param options0.onClick - Optional click handler override. If not provided, navigates to market detail page.
 * @param options0.variant - Visual variant - 'default' for perps tab, 'muted' for detail page
 * @param options0.assetName - Full asset name; falls back to the ticker when omitted
 */
export const OrderCard = ({
  order,
  onClick,
  variant = 'default',
  assetName,
}: OrderCardProps) => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const showFullAssetNames = useSelector(getIsPerpsShowFullAssetNamesEnabled);
  // Title uses the full asset name when enabled; the size line keeps the ticker
  // as its unit. When the flag is off, fall back to the ticker.
  const displayName = getDisplayName(
    showFullAssetNames ? assetName || order.symbol : order.symbol,
  );
  const displaySymbol = getDisplayName(order.symbol);
  const isTriggerBasedOrder =
    order.isTrigger === true || order.isPositionTpsl === true;

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

  // All order types display the limit/trigger price with universal decimals
  // (matching market price precision: 0 for BTC, 2 for CL, 6 for CHIP).
  // triggerPrice may be "0.0" for non-trigger orders, so parse both and pick
  // the first non-zero value (preferring triggerPrice for TP/SL orders).
  const orderValueUsd = useMemo(() => {
    const trigger = parseFloat(order.triggerPrice || '0') || 0;
    const limit = parseFloat(order.price || '0') || 0;
    const price = trigger || limit;
    if (price > 0) {
      return formatPerpsFiatUniversal(price);
    }
    return null;
  }, [order.triggerPrice, order.price]);

  const baseStyles = 'cursor-pointer pt-2 pb-2 px-4';
  // Non-trigger rows keep the fixed 62 px height to match the position/token tabs.
  // Trigger-based (TP/SL) rows grow with content; min-h keeps the floor at 62 px.
  const heightStyle = isTriggerBasedOrder ? 'h-auto min-h-[62px]' : 'h-[62px]';
  const variantStyles =
    variant === 'muted'
      ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
      : 'bg-default hover:bg-hover active:bg-pressed';

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0',
        // items-center keeps each column's content block centered in the card height,
        // whether the label fits on one line or wraps to two.
        'gap-4 text-left items-center',
        baseStyles,
        heightStyle,
        variantStyles,
        '[container-name:list-item] [container-type:inline-size]',
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
        {isTriggerBasedOrder ? (
          // TP/SL: render label directly in the column so it wraps freely.
          // The symbol is redundant here — it appears after the size below.
          <Text
            fontWeight={FontWeight.Medium}
            className="text-s-body-md @compact:text-s-body-sm"
          >
            {formatOrderLabel(order)}
          </Text>
        ) : (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text
              fontWeight={FontWeight.Medium}
              className="text-s-body-md @compact:text-s-body-sm"
            >
              {displayName}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {formatOrderLabel(order)}
            </Text>
          </Box>
        )}
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {order.size} {displaySymbol}
        </Text>
      </Box>
      {/* Right side: USD value */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text
          fontWeight={FontWeight.Medium}
          className="text-s-body-md @compact:text-s-body-sm"
        >
          {orderValueUsd ?? t('perpsMarket')}
        </Text>
        {isTriggerBasedOrder && orderValueUsd && (
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            {t('perpsTriggerPrice')}
          </Text>
        )}
      </Box>
    </ButtonBase>
  );
};

export default OrderCard;
