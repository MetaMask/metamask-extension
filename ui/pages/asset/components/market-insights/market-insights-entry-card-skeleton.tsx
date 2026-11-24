import React from 'react';
import { Box, Skeleton } from '@metamask/design-system-react';

export const MARKET_INSIGHTS_SKELETON_TEST_ID = 'market-insights-skeleton';

/**
 * MarketInsightsEntryCardSkeleton shows a placeholder version of the entry
 * card while the digest fetch is pending. Its height matches the card's title,
 * two-line body, and footer rows to avoid layout shift when data arrives.
 */
export const MarketInsightsEntryCardSkeleton = () => (
  <Box
    className="flex flex-col gap-1 rounded-xl bg-background-alternative p-4"
    data-testid={MARKET_INSIGHTS_SKELETON_TEST_ID}
  >
    <Box className="flex flex-col gap-2">
      <Skeleton height={22} width={130} />
    </Box>
    <Box className="flex flex-col gap-2">
      <Skeleton height={22} width="100%" />
      <Skeleton height={22} width="80%" />
    </Box>
    <Box className="mt-0.5 flex flex-col gap-2">
      <Skeleton height={22} width={220} />
    </Box>
  </Box>
);
