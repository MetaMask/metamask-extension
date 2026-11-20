import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Skeleton,
} from '@metamask/design-system-react';

type PerpsBalanceActionsSkeletonProps = {
  /**
   * `stacked` matches the Perps home header. `beside` matches the dapp-bar
   * sheet: a 28px balance line, a 16px available line, and two 32px buttons
   * on the right, so the sheet does not change height when data arrives.
   */
  placement?: 'stacked' | 'beside';
};

/**
 * PerpsBalanceActionsSkeleton component displays a loading skeleton for the balance actions
 * Matches the layout of PerpsMarketBalanceActions
 *
 * @param props
 * @param props.placement
 */
export const PerpsBalanceActionsSkeleton = ({
  placement = 'stacked',
}: PerpsBalanceActionsSkeletonProps) => {
  if (placement === 'beside') {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Between}
        className="w-full"
        data-testid="perps-balance-actions-skeleton"
      >
        <Box flexDirection={BoxFlexDirection.Column} className="min-w-0 flex-1">
          <Skeleton className="h-7 w-24" />
          <Box marginTop={1}>
            <Skeleton className="h-4 w-20" />
          </Box>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="ml-auto w-fit shrink-0"
        >
          <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
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
