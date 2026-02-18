import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';

/**
 * PerpsCardSkeleton component displays a loading skeleton for position/order/market cards
 * Matches the layout of PositionCard, OrderCard, and market list items
 */
export const PerpsCardSkeleton: React.FC = () => {
  return (
    <Box
      className="pt-2 pb-2 px-4 h-[62px] bg-default"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      data-testid="perps-card-skeleton"
    >
      {/* Token Logo Skeleton - matches AvatarTokenSize.Md (32px) */}
      <Skeleton className="h-8 w-8 shrink-0" borderRadius={BorderRadius.pill} />

      {/* Left side: Symbol and info */}
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </Box>
        <Skeleton className="h-3 w-20" />
      </Box>

      {/* Right side: Value and secondary info */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </Box>
    </Box>
  );
};

export default PerpsCardSkeleton;
