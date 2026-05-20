import * as React from 'react';
import { Box } from '@metamask/design-system-react';
import { Skeleton } from '../../../../components/component-library/skeleton';

import { BorderRadius } from '../../../../helpers/constants/design-system';

export const AssetChartLoading = () => {
  return (
    <Box
      className="asset-chart__empty-or-loading-state-container"
      data-testid="asset-chart-loading"
    >
      <Skeleton
        className="asset-chart__skeleton"
        borderRadius={BorderRadius.LG}
      />
    </Box>
  );
};
