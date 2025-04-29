import * as React from 'react';
import { Skeleton } from '../../../../components/component-library/skeleton';

import { Box } from '../../../../components/component-library';

export const AssetChartLoading = () => {
  return (
    <Box className="asset-chart__skeleton-container">
      <Skeleton className="asset-chart__skeleton" />
    </Box>
  );
};
