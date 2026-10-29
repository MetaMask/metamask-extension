import React from 'react';

import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { SortingChip } from './sorting-chip';

type SortingToolbarProps = {
  balance: {
    order: 'asc' | 'desc';
    onClick: (newSort: 'asc' | 'desc') => void;
  };
};

export const SortingToolbar = ({ balance }: SortingToolbarProps) => {
  return (
    <Box
      paddingVertical={2}
      gap={2}
      flexDirection={BoxFlexDirection.Row}
      className="w-full"
      style={{ overflowX: 'auto' }}
      data-testid="batch-sell-select-sorting-toolbar"
    >
      <SortingChip order={balance.order} onClick={balance.onClick} />
    </Box>
  );
};
