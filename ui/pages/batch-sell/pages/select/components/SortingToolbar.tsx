import React from 'react';

import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { SortingChip } from './SortingChip';

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
      className="w-full"
      data-testid="batch-sell-select-sorting-toolbar"
    >
      <Box
        gap={2}
        flexDirection={BoxFlexDirection.Row}
        style={{
          overflowX: 'auto',
        }}
      >
        <SortingChip order={balance.order} onClick={balance.onClick} />
      </Box>
    </Box>
  );
};
