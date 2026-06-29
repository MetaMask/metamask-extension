import React from 'react';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';

/**
 * Full-viewport loading placeholder for the expanded perps view, shown while
 * market metadata hydrates.
 */
export const PerpsExpandedSkeleton = () => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    className="h-screen w-full overflow-hidden bg-background-default"
    data-testid="perps-expanded-skeleton"
  >
    <Skeleton className="h-16 w-full" />
    <Box className="grid min-h-0 flex-1 grid-cols-3 gap-2 p-2">
      <Skeleton className="h-full w-full rounded-lg" />
      <Skeleton className="h-full w-full rounded-lg" />
      <Skeleton className="h-full w-full rounded-lg" />
    </Box>
    <Skeleton className="h-32 w-full" />
  </Box>
);
