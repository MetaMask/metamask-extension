import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';

/**
 * PerpsDetailPageSkeleton component displays a loading skeleton for the market detail page
 * Matches the layout of PerpsMarketDetailPage
 */
export const PerpsDetailPageSkeleton: React.FC = () => {
  return (
    <Box
      className="main-container asset__container"
      data-testid="perps-detail-page-skeleton"
    >
      {/* Header */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
        gap={2}
      >
        {/* Back Button Placeholder */}
        <Box className="p-2 -ml-2">
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>

        {/* Token Logo Skeleton */}
        <Skeleton
          className="h-10 w-10 shrink-0"
          borderRadius={BorderRadius.pill}
        />

        {/* Header Content Skeleton */}
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Skeleton className="h-4 w-20" />
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </Box>
        </Box>

        {/* Spacer */}
        <Box className="flex-1" />

        {/* Favorite Star Placeholder */}
        <Box className="p-2">
          <Icon
            name={IconName.Star}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>
      </Box>

      {/* Chart Skeleton */}
      <Box paddingLeft={4} paddingRight={4}>
        <Skeleton className="h-[250px] w-full" borderRadius={BorderRadius.LG} />
      </Box>

      {/* Period Selector Skeleton */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Evenly}
        paddingTop={3}
        paddingBottom={3}
        paddingLeft={4}
        paddingRight={4}
      >
        {['1m', '5m', '15m', '1h', '4h', '1d'].map((period) => (
          <Skeleton
            key={period}
            className="h-8 w-10"
            borderRadius={BorderRadius.MD}
          />
        ))}
      </Box>

      {/* Stats Section Skeleton */}
      <Box paddingLeft={4} paddingRight={4}>
        <Box paddingTop={4} paddingBottom={2}>
          <Skeleton className="h-5 w-16" />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="overflow-hidden rounded-xl"
        >
          {/* Stats Rows */}
          {[1, 2, 3].map((index) => (
            <Box
              key={index}
              className="bg-muted px-4 py-3"
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recent Activity Section Skeleton */}
      <Box paddingLeft={4} paddingRight={4}>
        <Box paddingTop={4} paddingBottom={2}>
          <Skeleton className="h-5 w-32" />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="overflow-hidden rounded-xl"
        >
          {/* Activity Items - matches TransactionCard (62px height, 8px v-padding, 16px h-padding, 16px gap, 32px logo) */}
          {[1, 2, 3].map((index) => (
            <Box
              key={index}
              className="w-full bg-muted pt-2 pb-2 px-4 h-[62px]"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={4}
            >
              <Skeleton
                className="h-8 w-8 shrink-0"
                borderRadius={BorderRadius.pill}
              />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="min-w-0 flex-1"
                gap={1}
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </Box>
              <Skeleton className="h-4 w-16" />
            </Box>
          ))}
        </Box>

        {/* Learn Section Skeleton */}
        <Box className="mt-4 w-full rounded-xl bg-muted px-4 py-3">
          <Skeleton className="h-5 w-32" />
        </Box>

        {/* Disclaimer Skeleton */}
        <Box paddingTop={4} paddingBottom={4}>
          <Skeleton className="h-3 w-full" />
          <Box paddingTop={1}>
            <Skeleton className="h-3 w-3/4" />
          </Box>
        </Box>
      </Box>

      {/* Sticky Footer Skeleton */}
      <Box
        className="sticky bottom-0 left-0 right-0 bg-default border-t border-muted"
        paddingLeft={4}
        paddingRight={4}
        paddingTop={3}
        paddingBottom={4}
      >
        <Box flexDirection={BoxFlexDirection.Row} gap={3}>
          <Skeleton className="h-12 flex-1" borderRadius={BorderRadius.LG} />
          <Skeleton className="h-12 flex-1" borderRadius={BorderRadius.LG} />
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsDetailPageSkeleton;
