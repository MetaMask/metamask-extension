import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Box from '../../ui/box/box';
import { Button } from '../../component-library';

export const TestTab = () => {
  const queryClient = useQueryClient();

  const queryKey = [
    'RewardsDataService:estimatePoints',
    {
      activityType: 'SWAP',
      account: 'eip155:1:0xe6ce02E6d53C684727eBa68C500bA14d814621C4',
      activityContext: {
        swapContext: {
          srcAsset: {
            id: 'eip155:1/slip44:60',
            amount: '1000000000000000000',
          },
          destAsset: {
            id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '4500000000',
          },
          feeAsset: {
            id: 'eip155:1/slip44:60',
            amount: '5000000000000000',
          },
        },
      },
    },
  ];

  const query = useQuery({ queryKey });

  const handleInvalidateClick = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return (
    <Box>
      {query.status} {JSON.stringify(query.data)}
      <Button onClick={handleInvalidateClick}>Invalidate</Button>
    </Box>
  );
};
