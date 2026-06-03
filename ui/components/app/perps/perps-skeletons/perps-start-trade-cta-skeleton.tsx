import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';

/**
 * PerpsStartTradeCtaSkeleton displays a loading skeleton for the Start a new trade CTA
 * Matches the layout of StartTradeCta: 62px height, 8px v-padding, 16px h-padding, 16px gap, 32px icon
 */
export const PerpsStartTradeCtaSkeleton: React.FC = () => {
  return (
    <Box
      className="h-[62px] pt-2 pb-2 px-4 bg-transparent"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      data-testid="perps-start-trade-cta-skeleton"
    >
      {/* Icon circle - matches StartTradeCta (h-8 w-8) */}
      <Skeleton className="h-8 w-8 shrink-0" borderRadius={BorderRadius.pill} />
      <Skeleton className="h-4 w-36" />
    </Box>
  );
};

export default PerpsStartTradeCtaSkeleton;
