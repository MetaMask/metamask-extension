import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Skeleton,
} from '@metamask/design-system-react';

type PerpsBalanceActionsSkeletonProps = {
  variant?: 'default' | 'compact';
};

/**
 * PerpsBalanceActionsSkeleton component displays a loading skeleton for the balance actions
 * Matches the layout of PerpsMarketBalanceActions
 *
 * @param props
 * @param props.variant
 */
export const PerpsBalanceActionsSkeleton = ({
  variant = 'default',
}: PerpsBalanceActionsSkeletonProps) => {
  if (variant === 'compact') {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.End}
        justifyContent={BoxJustifyContent.Between}
        gap={4}
        className="w-full"
        data-testid="perps-balance-actions-skeleton"
      >
        <Skeleton className="h-10 w-24" />
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="shrink-0"
        >
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="perps-balance-actions-skeleton"
    >
      {/* Account Value Skeleton */}
      <Skeleton className="h-14 w-40 md:h-[75px]" />

      {/* Available Balance Label Skeleton */}
      <Box marginTop={1}>
        <Skeleton className="h-5 w-24" />
      </Box>

      {/* Action Buttons Skeleton */}
      <Box flexDirection={BoxFlexDirection.Row} gap={3} marginTop={4}>
        <Skeleton className="h-12 flex-1 rounded-full" />
        <Skeleton className="h-12 flex-1 rounded-full" />
      </Box>
    </Box>
  );
};

export default PerpsBalanceActionsSkeleton;
