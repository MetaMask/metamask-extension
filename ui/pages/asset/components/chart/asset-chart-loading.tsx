import * as React from 'react';
import { Skeleton } from '@metamask/design-system-react';

import { Box } from '../../../../components/component-library';

export const AssetChartLoading = () => {
  return (
    <Box
      className="asset-chart__empty-or-loading-state-container"
      data-testid="asset-chart-loading"
    >
      <Skeleton hideChildren className="asset-chart__skeleton rounded-lg" />
    </Box>
  );
};
