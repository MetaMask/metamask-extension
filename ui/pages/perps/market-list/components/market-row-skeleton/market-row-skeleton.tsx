import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../../../components/component-library/skeleton';
import { BorderRadius } from '../../../../../helpers/constants/design-system';

/**
 * MarketRowSkeleton component displays a loading skeleton for market rows
 * Matches the layout of MarketRow for smooth loading transitions
 */
export const MarketRowSkeleton: React.FC = () => {
  return (
    <Box
      className="px-4 py-3"
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
      data-testid="market-row-skeleton"
    >
      {/* Token Logo Skeleton */}
      <Skeleton
        className="h-10 w-10 shrink-0"
        borderRadius={BorderRadius.pill}
      />

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
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-8" />
        </Box>
        <Skeleton className="h-3 w-16" />
      </Box>

      {/* Right side: Price and change */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </Box>
    </Box>
  );
};

export default MarketRowSkeleton;
