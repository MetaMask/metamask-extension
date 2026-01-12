import React from 'react';
import classnames from 'classnames';
import { Icon, IconName, IconSize } from '../../../component-library';
import { mockAccountState } from '../mocks';

export interface PerpsTabControlBarProps {
  /** Callback when balance row is clicked */
  onManageBalancePress?: () => void;
  /** Whether the user has open positions (controls P&L row visibility) */
  hasPositions?: boolean;
}

/**
 * Format a number as currency with $ prefix
 */
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format P&L with +/- prefix
 */
const formatPnl = (value: string): string => {
  const num = parseFloat(value);
  const prefix = num >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format ROE as percentage
 */
const formatPercentage = (value: string): string => {
  const num = parseFloat(value);
  return `${num.toFixed(2)}%`;
};

/**
 * PerpsTabControlBar displays total balance and unrealized P&L
 * at the top of the Perps tab
 */
export const PerpsTabControlBar: React.FC<PerpsTabControlBarProps> = ({
  onManageBalancePress,
  hasPositions = false,
}) => {
  const { totalBalance, unrealizedPnl, returnOnEquity } = mockAccountState;
  const pnlNum = parseFloat(unrealizedPnl);
  const isProfit = pnlNum >= 0;

  const handleBalanceClick = () => {
    onManageBalancePress?.();
  };

  return (
    <div className="perps-tab-control-bar" data-testid="perps-tab-control-bar">
      {/* Total Balance Row */}
      <div
        className={classnames('perps-tab-control-bar__row', {
          'perps-tab-control-bar__row--top': hasPositions,
          'perps-tab-control-bar__row--single': !hasPositions,
        })}
        onClick={handleBalanceClick}
        onKeyDown={(e) => e.key === 'Enter' && handleBalanceClick()}
        role="button"
        tabIndex={0}
        data-testid="perps-control-bar-balance"
      >
        <span className="perps-tab-control-bar__label">Total Balance</span>
        <div className="perps-tab-control-bar__value-container">
          <span className="perps-tab-control-bar__value">
            {formatCurrency(totalBalance)}
          </span>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="perps-tab-control-bar__arrow"
          />
        </div>
      </div>

      {/* Unrealized P&L Row - only shown when there are positions */}
      {hasPositions && (
        <div
          className="perps-tab-control-bar__row perps-tab-control-bar__row--bottom"
          data-testid="perps-control-bar-pnl"
        >
          <span className="perps-tab-control-bar__label">Unrealized P&L</span>
          <span
            className={classnames('perps-tab-control-bar__pnl', {
              'perps-tab-control-bar__pnl--profit': isProfit,
              'perps-tab-control-bar__pnl--loss': !isProfit,
            })}
          >
            {formatPnl(unrealizedPnl)} ({formatPercentage(returnOnEquity)})
          </span>
        </div>
      )}
    </div>
  );
};

export default PerpsTabControlBar;

