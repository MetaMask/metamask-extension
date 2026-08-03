import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';

export type RampsListSkeletonProps = {
  /** Number of placeholder rows to render. */
  rows?: number;
  /** Renders a leading circular placeholder for rows that have an icon. */
  showAvatar?: boolean;
  testId?: string;
};

/**
 * Skeleton placeholder for the ramps provider / payment-method lists, matching
 * the `Pay with_loading` state in the Buy Figma spec.
 *
 * @param options0
 * @param options0.rows
 * @param options0.showAvatar
 * @param options0.testId
 */
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
          key={index}
          className="w-full"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          {showAvatar ? (
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
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
