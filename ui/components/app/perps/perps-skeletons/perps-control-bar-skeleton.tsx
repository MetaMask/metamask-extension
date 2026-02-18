import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';

/**
 * PerpsControlBarSkeleton component displays a loading skeleton for the control bar
 * Matches the layout of PerpsTabControlBar
 */
export const PerpsControlBarSkeleton: React.FC = () => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      data-testid="perps-control-bar-skeleton"
    >
      {/* Total Balance Row Skeleton */}
      <Box
        className="w-full bg-muted px-4 py-3 rounded-xl"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Skeleton className="h-4 w-24" />
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" borderRadius={BorderRadius.SM} />
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsControlBarSkeleton;
