import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';

const SKELETON_ROW_COUNT = 3;

const ActivityRowSkeleton = () => {
  return (
    <Box
      className="min-h-[62px] px-4 py-2"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
    >
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-44" />
      </Box>

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

/**
 * ActivityListSkeleton displays a loading skeleton for the activity list.
 * Matches the layout: date header + 3 transaction rows.
 */
export const ActivityListSkeleton = () => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="activity-list-skeleton"
      className="pb-4"
    >
      <Box className="px-4 pt-4 pb-1">
        <Skeleton className="h-4 w-24" />
      </Box>

      <Box flexDirection={BoxFlexDirection.Column}>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <ActivityRowSkeleton key={index} />
        ))}
      </Box>
    </Box>
  );
};
