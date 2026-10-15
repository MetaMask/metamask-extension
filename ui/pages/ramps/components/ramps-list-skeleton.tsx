import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';

export type RampsListSkeletonProps = {
  rows?: number;
  showAvatar?: boolean;
  testId?: string;
};

export default function RampsListSkeleton({
  rows = 3,
  showAvatar = false,
  testId,
}: RampsListSkeletonProps) {
  return (
    <Box
      className="flex-1 px-4 pt-2"
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      data-testid={testId}
    >
      {Array.from({ length: rows }, (_, index) => (
        <Box
          key={`skeleton-row-${index}`}
          className="w-full"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          {showAvatar ? (
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          ) : null}
          <Box
            className="min-w-0 flex-1"
            flexDirection={BoxFlexDirection.Column}
            gap={2}
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-1/3" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
