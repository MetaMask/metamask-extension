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
import { useFormatters } from '../../../../hooks/useFormatters';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName, getPositionDirection } from '../utils';
import type { Position } from '../types';

export type PositionCardProps = {
  position: Position;
};

/**
 * PositionCard component displays individual position information
 * Two rows: coin/leverage/direction + size on left, entry price + P&L on right
 *
 * @param options0 - Component props
 * @param options0.position - The position data to display
 */
export const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const direction = getPositionDirection(position.size);
  const pnlNum = parseFloat(position.unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const absSize = Math.abs(parseFloat(position.size)).toString();
  const displayName = getDisplayName(position.coin);
  const pnlPrefix = isProfit ? '+' : '-';
  const formattedPnl = `${pnlPrefix}${formatCurrencyWithMinThreshold(Math.abs(pnlNum), 'USD')}`;

  return (
    <Box
      className="cursor-pointer bg-default px-4 py-3 hover:bg-hover active:bg-pressed"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
      data-testid={`position-card-${position.coin}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={position.coin}
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

      {/* Right side: Entry price and P&L */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          ${position.entryPrice}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault}
        >
          {formattedPnl}
        </Text>
      </Box>
    </Box>
  );
};

export default PositionCard;
