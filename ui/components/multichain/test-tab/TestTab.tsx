import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useQuery,
  useInfiniteQuery,
} from '@metamask-previews/base-data-service';
import Box from '../../ui/box/box';
import { Button } from '../../component-library';
import type { GetActivityResponse } from '../../../../app/scripts/queries/ActivityDataService';

export const TestTab = () => {
  const queryClient = useQueryClient();

  const infiniteQuery = useInfiniteQuery<GetActivityResponse>({
    queryKey: [
      'ActivityDataService:getActivity',
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ],
    getNextPageParam: ({ pageInfo }) =>
      pageInfo?.hasNextPage ? pageInfo.endCursor : undefined,
  });

  const assetsQueryKey = [
    'AssetDataService:getAssets',
    [
      'eip155:1/slip44:60',
      'bip122:000000000019d6689c085ae165831e93/slip44:0',
      'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
    ],
  ];

  const query = useQuery({
    queryKey: assetsQueryKey,
  });

  const handleFetchNextPage = () => {
    infiniteQuery.fetchNextPage();
  };

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: assetsQueryKey });
  };

  return (
    <Box>
      <Box>
        {infiniteQuery.status} {JSON.stringify(infiniteQuery.data)}
        {infiniteQuery.hasNextPage && (
          <Button onClick={handleFetchNextPage}>Next Page</Button>
        )}
      </Box>

      <Box>
        {query.status} {JSON.stringify(query.data)}
        <Button onClick={handleInvalidate}>Invalidate</Button>
      </Box>
    </Box>
  );
};
