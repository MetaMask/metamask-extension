import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';

const DISCOVER_SEARCH_SKELETON_ROW_COUNT = 3;

const DiscoverSearchRowSkeleton = ({
  'data-testid': dataTestId,
}: {
  'data-testid': string;
}) => (
  <Box
    className="min-h-[72px] gap-3 px-4 py-3"
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    data-testid={dataTestId}
  >
    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
    <Box
      className="min-w-0 flex-1 gap-2"
      flexDirection={BoxFlexDirection.Column}
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-36" />
    </Box>
    <Box className="shrink-0 gap-2" flexDirection={BoxFlexDirection.Column}>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-12" />
    </Box>
  </Box>
);

export const DiscoverSearchSectionSkeleton = ({
  testIdPrefix,
}: {
  testIdPrefix: string;
}) => (
  <>
    {Array.from({ length: DISCOVER_SEARCH_SKELETON_ROW_COUNT }, (_, index) => (
      <DiscoverSearchRowSkeleton
        key={index}
        data-testid={`${testIdPrefix}-skeleton-${index}`}
      />
    ))}
  </>
);
