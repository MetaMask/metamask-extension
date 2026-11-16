import React from 'react';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';

export const MARKET_INSIGHTS_VIEW_SKELETON_TEST_ID =
  'market-insights-view-skeleton';

/**
 * Placeholder matching the full Market Insights layout — hero banner,
 * headline, summary, trend rows, and tweet cards — while the digest loads.
 *
 * @returns The view skeleton.
 */
export const MarketInsightsViewSkeleton = () => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    data-testid={MARKET_INSIGHTS_VIEW_SKELETON_TEST_ID}
  >
    <Skeleton width="100%" style={{ aspectRatio: '786 / 340' }} />

    <Box className="gap-2 px-4 pb-3 pt-4">
      <Skeleton height={28} width="90%" />
      <Skeleton height={28} width="62%" />
    </Box>

    <Box className="gap-2 px-4 pb-6">
      <Skeleton height={16} width="94%" />
      <Skeleton height={16} width="85%" />
      <Skeleton height={16} width="88%" />
      <Skeleton height={16} width="56%" />
    </Box>

    <Box className="pb-6">
      <Box className="gap-3 px-4">
        <Skeleton height={64} width="100%" className="rounded-xl" />
        <Skeleton height={64} width="100%" className="rounded-xl" />
        <Skeleton height={64} width="100%" className="rounded-xl" />
      </Box>
    </Box>

    <Box className="pb-6">
      <Box className="px-4 py-4">
        <Skeleton height={16} width={150} />
      </Box>

      <Box className="gap-3 px-4">
        <Skeleton height={120} width="100%" className="rounded-2xl" />
        <Skeleton height={120} width="100%" className="rounded-2xl" />
      </Box>
    </Box>
  </Box>
);
