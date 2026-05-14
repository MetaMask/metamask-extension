import React from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Skeleton } from '../../../component-library/skeleton';
import { PerpsMarketExpandedHeaderSkeleton } from './perps-market-expanded-header';

export const PerpsMarketExpandedSkeleton: React.FC = () => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    className="h-screen w-full overflow-hidden bg-background-default"
    data-testid="perps-market-expanded-skeleton"
  >
    <PerpsMarketExpandedHeaderSkeleton />
    <div
      className="grid min-h-0 flex-1 overflow-hidden max-[980px]:overflow-y-auto"
      style={{
        gridTemplateColumns:
          'minmax(420px, 1fr) minmax(280px, 0.42fr) minmax(320px, 0.5fr)',
      }}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 overflow-hidden border-r border-border-muted max-[980px]:min-h-[520px]"
      >
        <Box className="min-h-0 flex-1 overflow-hidden px-3 pt-3">
          <Skeleton className="h-full w-full rounded-lg" />
        </Box>
        <Box className="flex shrink-0 gap-3 px-3 pb-3 pt-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-12" />
          ))}
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 overflow-hidden border-r border-border-muted max-[980px]:min-h-[420px]"
      >
        <Box className="shrink-0 px-3 py-2">
          <Skeleton className="h-5 w-20" />
        </Box>
        <Box className="flex min-h-0 flex-1 flex-col gap-1 px-2 py-1">
          {Array.from({ length: 18 }).map((_, index) => (
            <Skeleton key={index} className="h-[22px] w-full" />
          ))}
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 overflow-hidden px-3 py-3"
      >
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="mb-3 h-8 w-28" />
        <Skeleton className="mb-3 h-12 w-full" />
        <Skeleton className="mb-3 h-12 w-full" />
        <Skeleton className="mb-3 h-8 w-full" />
        <Skeleton className="h-10 w-full" />
      </Box>
    </div>
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="max-h-[280px] min-h-[180px] shrink-0 overflow-hidden border-t border-border-muted"
    >
      <Box className="flex shrink-0 gap-6 px-4 py-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </Box>
      {Array.from({ length: 3 }).map((_, index) => (
        <Box
          key={index}
          className="grid min-h-[56px] grid-cols-[minmax(140px,1.1fr)_minmax(110px,0.8fr)_minmax(110px,0.8fr)_minmax(120px,0.8fr)_minmax(260px,auto)] items-center gap-3 border-b border-border-muted px-4 py-2"
        >
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </Box>
      ))}
    </Box>
  </Box>
);
