import React from 'react';
import classnames from 'classnames';
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
 * PositionCard component displays individual position information
 * Two rows: coin/leverage/direction + size on left, entry price + P&L on right
 */
export const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const direction = getPositionDirection(position.size);
  const isProfit = parseFloat(position.unrealizedPnl) >= 0;
  const absSize = Math.abs(parseFloat(position.size)).toString();

  return (
    <div
      className="position-card"
      data-testid={`position-card-${position.coin}`}
    >
      {/* Left side: Coin info and size */}
      <div className="position-card__left">
        <div className="position-card__header-row">
          <span className="position-card__coin-symbol">{position.coin}</span>
          <span className="position-card__leverage-direction">
            {position.leverage.value}x {direction}
          </span>
        </div>
        <span className="position-card__size">
          {absSize} {position.coin}
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
