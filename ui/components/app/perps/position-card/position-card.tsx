import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { AvatarTokenSize } from '../../../component-library';
import { PerpsTokenLogo } from '../perps-token-logo';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';
import type { Position } from '../types';

export interface PositionCardProps {
  position: Position;
  /** Optional click handler override. If not provided, navigates to market detail page. */
  onClick?: (position: Position) => void;
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
 * Clicking the card navigates to the market detail page for that symbol
 */
export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClick,
}) => {
  const navigate = useNavigate();
  const direction = getPositionDirection(position.size);
  const isProfit = parseFloat(position.unrealizedPnl) >= 0;
  const absSize = Math.abs(parseFloat(position.size)).toString();
  const displayName = getDisplayName(position.coin);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(position);
    } else {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(position.coin)}`,
      );
    }
  }, [navigate, position, onClick]);

  return (
    <div
      className="position-card position-card--clickable"
      data-testid={`position-card-${position.coin}`}
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
        symbol={position.coin}
        size={AvatarTokenSize.Md}
        className="position-card__logo"
      />

      {/* Left side: Coin info and size */}
      <div className="position-card__left">
        <div className="position-card__header-row">
          <span className="position-card__coin-symbol">{displayName}</span>
          <span className="position-card__leverage-direction">
            {position.leverage.value}x {direction}
          </span>
        </div>
        <span className="position-card__size">
          {absSize} {displayName}
        </span>
      </div>

      {/* Right side: Entry price and P&L */}
      <div className="position-card__right">
        <span className="position-card__entry-price">
          ${position.entryPrice}
        </span>
        <span
          className={classnames('position-card__pnl', {
            'position-card__pnl--profit': isProfit,
            'position-card__pnl--loss': !isProfit,
          })}
        >
          {isProfit ? '+' : ''}${position.unrealizedPnl}
        </span>
      </div>
    </div>
  );
};

export default PositionCard;
