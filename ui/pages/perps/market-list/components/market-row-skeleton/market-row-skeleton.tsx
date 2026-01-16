import React from 'react';

export type MarketRowSkeletonProps = {
  className?: string;
};

/**
 * MarketRowSkeleton - Loading skeleton for market rows
 *
 * Displays placeholder content while market data is loading.
 * Matches the layout of MarketRow component.
 *
 * @param options0 - Component props
 * @param options0.className - Additional CSS class
 */
export const MarketRowSkeleton: React.FC<MarketRowSkeletonProps> = ({
  className,
}) => {
  return (
    <div
      className={`
        flex justify-between items-center px-4 py-4 min-h-[72px]
        ${className ?? ''}
      `}
    >
      {/* Left section */}
      <div className="flex items-center flex-1">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 rounded-full bg-background-alternative animate-pulse mr-4" />

        <div className="flex-1">
          {/* Token header row */}
          <div className="flex items-center gap-2 mb-1.5">
            {/* Symbol skeleton */}
            <div className="w-[60px] h-4 rounded bg-background-alternative animate-pulse" />
            {/* Leverage skeleton */}
            <div className="w-[30px] h-3.5 rounded bg-background-alternative animate-pulse" />
          </div>
          {/* Metric skeleton */}
          <div className="w-[80px] h-3 rounded bg-background-alternative animate-pulse" />
        </div>
      </div>

      {/* Right section */}
      <div className="flex flex-col items-end flex-1">
        {/* Price skeleton */}
        <div className="w-[90px] h-4 rounded bg-background-alternative animate-pulse mb-1.5" />
        {/* Change skeleton */}
        <div className="w-[70px] h-3.5 rounded bg-background-alternative animate-pulse" />
      </div>
    </div>
  );
};

export default MarketRowSkeleton;
