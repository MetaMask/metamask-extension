import React from 'react';

export type MarketBadgeType = 'equity' | 'commodity' | 'forex';

export type MarketBadgeProps = {
  type: MarketBadgeType;
  className?: string;
};

const badgeStyles: Record<MarketBadgeType, string> = {
  equity: 'bg-warning-muted text-warning-default',
  commodity: 'bg-success-muted text-success-default',
  forex: 'bg-error-muted text-error-default',
};

const badgeLabelKeys: Record<MarketBadgeType, string> = {
  equity: 'STOCK',
  commodity: 'COMMODITY',
  forex: 'FOREX',
};

/**
 * MarketBadge - Badge component for HIP-3 market types
 *
 * Displays a colored badge indicating the market type:
 * - equity (STOCK): orange
 * - commodity: green
 * - forex: red
 *
 * @param options0 - Component props
 * @param options0.type - The market type (equity, commodity, forex)
 * @param options0.className - Additional CSS class
 */
export const MarketBadge: React.FC<MarketBadgeProps> = ({
  type,
  className,
}) => {
  const label = badgeLabelKeys[type];

  return (
    <span
      className={`
        inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
        ${badgeStyles[type]}
        ${className ?? ''}
      `}
    >
      {label}
    </span>
  );
};

export default MarketBadge;
