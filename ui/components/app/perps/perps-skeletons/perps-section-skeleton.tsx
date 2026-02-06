import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../component-library/skeleton';
import { PerpsCardSkeleton } from './perps-card-skeleton';

export type PerpsSectionSkeletonProps = {
  /** Number of card skeletons to show (default: 3) */
  cardCount?: number;
  /** Whether to show the section header skeleton */
  showHeader?: boolean;
};

/**
 * PerpsSectionSkeleton component displays a loading skeleton for a section with cards
 * Used for positions, orders, and explore sections
 *
 * @param options0
 * @param options0.cardCount
 * @param options0.showHeader
 */
export const PerpsSectionSkeleton: React.FC<PerpsSectionSkeletonProps> = ({
  cardCount = 3,
  showHeader = true,
}) => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-section-skeleton"
    >
      {/* Section Header Skeleton */}
      {showHeader && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          marginBottom={2}
        >
          <Skeleton className="h-4 w-32" />
        </Box>
      )}

      {/* Card Skeletons */}
      <Box flexDirection={BoxFlexDirection.Column}>
        {Array.from({ length: cardCount }).map((_, index) => (
          <PerpsCardSkeleton key={`card-skeleton-${index}`} />
        ))}
      </Box>
    </Box>
  );
};

export default PerpsSectionSkeleton;
