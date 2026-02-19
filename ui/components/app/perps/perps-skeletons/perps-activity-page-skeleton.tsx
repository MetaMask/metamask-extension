import React from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';

import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';
import { PerpsCardSkeleton } from './perps-card-skeleton';

/**
 * PerpsActivityPageSkeleton displays a loading skeleton for the activity page
 * Matches the layout: filter dropdown + date groups with transaction cards
 */
export const PerpsActivityPageSkeleton: React.FC = () => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="perps-activity-page-skeleton"
    >
      {/* Filter Dropdown Skeleton */}
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
        <Skeleton className="h-10 w-full" borderRadius={BorderRadius.MD} />
      </Box>

      {/* Date groups with transaction cards */}
      {[1, 2].map((groupIndex) => (
        <Box
          key={groupIndex}
          flexDirection={BoxFlexDirection.Column}
          marginBottom={2}
        >
          {/* Date Header Skeleton */}
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingTop={3}
            paddingBottom={2}
          >
            <Skeleton className="h-4 w-24" />
          </Box>

          {/* Transaction Card Skeletons */}
          <Box flexDirection={BoxFlexDirection.Column}>
            {[1, 2, 3].map((cardIndex) => (
              <PerpsCardSkeleton key={cardIndex} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default PerpsActivityPageSkeleton;
