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
import type { Position } from '../types';

export interface PositionCardProps {
  position: Position;
}

/**
 * Determines if a position is long (positive size) or short (negative size)
 */
const getPositionDirection = (size: string): 'long' | 'short' => {
  return parseFloat(size) >= 0 ? 'long' : 'short';
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
 * PositionCard component displays individual position information
 * Two rows: coin/leverage/direction + size on left, entry price + P&L on right
 */
export const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const direction = getPositionDirection(position.size);
  const isProfit = parseFloat(position.unrealizedPnl) >= 0;
  const absSize = Math.abs(parseFloat(position.size)).toString();
  const displayName = getDisplayName(position.coin);

  return (
    <Box
      className="position-card"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={3}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
      data-testid={`position-card-${position.coin}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={position.coin}
        size={AvatarTokenSize.Md}
        className="position-card__logo"
      />

      {/* Left side: Coin info and size */}
      <Box
        className="position-card__left"
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
            {position.leverage.value}x {direction}
          </Text>
        </Box>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {absSize} {displayName}
        </Text>
      </Box>

      {/* Right side: Entry price and P&L */}
      <Box
        className="position-card__right"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        gap={1}
      >
        <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
          ${position.entryPrice}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={isProfit ? TextColor.successDefault : TextColor.errorDefault}
        >
          {isProfit ? '+' : ''}${position.unrealizedPnl}
        </Text>
      </Box>
    </Box>
  );
};

export default PositionCard;
