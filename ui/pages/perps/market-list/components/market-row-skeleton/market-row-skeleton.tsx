import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';

/**
 * MarketRowSkeleton component displays a loading skeleton for market rows
 * Matches the layout of MarketRow for smooth loading transitions
 */
export const MarketRowSkeleton: React.FC = () => {
  return (
    <Box
      className="animate-pulse bg-default px-4 py-3"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
      data-testid="market-row-skeleton"
    >
      {/* Token Logo Skeleton */}
      <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />

      {/* Left side: Symbol and metric */}
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-3 w-8 rounded bg-muted" />
        </Box>
        <div className="h-3 w-16 rounded bg-muted" />
      </Box>

      {/* Right side: Price and change */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
      </Box>
    </Box>
  );
};

export default MarketRowSkeleton;
