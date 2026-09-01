import React from 'react';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';

/**
 * PerpsBalanceActionsSkeleton component displays a loading skeleton for the balance actions
 * Matches the layout of PerpsMarketBalanceActions
 */
export const PerpsBalanceActionsSkeleton = () => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="perps-balance-actions-skeleton"
    >
      {/* Account Value Skeleton */}
      <Skeleton className="h-10 w-40" />

      {/* Available Balance Label Skeleton */}
      <Box marginTop={1}>
        <Skeleton className="h-5 w-24" />
      </Box>

      {/* Action Buttons Skeleton */}
      <Box flexDirection={BoxFlexDirection.Row} gap={3} marginTop={4}>
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 flex-1 rounded-lg" />
      </Box>
    </Box>
  );
};

export default PerpsBalanceActionsSkeleton;
