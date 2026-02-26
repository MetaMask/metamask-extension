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
import { useFormatters } from '../../../../hooks/useFormatters';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName, getPositionDirection } from '../utils';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';
import type { Position } from '@metamask/perps-controller';

export type PositionCardProps = {
  position: Position;
  onClick?: (position: Position) => void;
};

/**
 * PositionCard component displays individual position information
 * Two rows: coin/leverage/direction + size on left, position value + P&L on right
 * Clicking the card navigates to the market detail page for that symbol
 *
 * @param options0 - Component props
 * @param options0.position - The position data to display
 * @param options0.onClick
 */
export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClick,
}) => {
  const navigate = useNavigate();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const direction = getPositionDirection(position.size);
  const pnlNum = parseFloat(position.unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const absSize = Math.abs(parseFloat(position.size)).toString();
  const displayName = getDisplayName(position.symbol);
  const pnlPrefix = isProfit ? '+' : '-';
  const formattedPnl = `${pnlPrefix}${formatCurrencyWithMinThreshold(Math.abs(pnlNum), 'USD')}`;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(position);
    } else {
      // TODO: Add Metrics tracking
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(position.symbol)}`,
      );
    }
  }, [navigate, position, onClick]);

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0',
        // Card styles (matches tokens tab: 62px height, 8px v-padding, 16px h-padding, 16px gap)
        'gap-4 text-left cursor-pointer',
        'bg-default pt-2 pb-2 px-4 h-[62px]',
        'hover:bg-hover active:bg-pressed',
      )}
      isFullWidth
      onClick={handleClick}
      data-testid={`position-card-${position.symbol}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={position.symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />

      {/* Left side: Coin info and size */}
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
            {position.leverage.value}x {direction}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {absSize} {displayName}
        </Text>
      </Box>

      {/* Right side: Position value and P&L */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {formatCurrencyWithMinThreshold(
            parseFloat(position.positionValue),
            'USD',
          )}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault}
        >
          {formattedPnl}
        </Text>
      </Box>
    </ButtonBase>
  );
};

export default PositionCard;
