import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Skeleton,
} from '@metamask/design-system-react';

import { PerpsCardSkeleton } from './perps-card-skeleton';
import { PerpsStartTradeCtaSkeleton } from './perps-start-trade-cta-skeleton';

export type PerpsSectionSkeletonProps = {
  /** Number of card skeletons to show (default: 3) */
  cardCount?: number;
  /** Whether to show the section header skeleton */
  showHeader?: boolean;
  /** Whether to show the Start a new trade CTA skeleton (e.g. for positions section) */
  showStartTradeCta?: boolean;
};

/**
 * PerpsSectionSkeleton component displays a loading skeleton for a section with cards
 * Used for positions, orders, and explore sections
 *
 * @param options0
 * @param options0.cardCount
 * @param options0.showHeader
 * @param options0.showStartTradeCta
 */
export const PerpsSectionSkeleton = ({
  cardCount = 3,
  showHeader = true,
  showStartTradeCta = false,
}: PerpsSectionSkeletonProps) => {
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

      {/* Start Trade CTA Skeleton - matches positions section layout */}
      {showStartTradeCta && <PerpsStartTradeCtaSkeleton />}
    </Box>
  );
};

export default PerpsSectionSkeleton;
