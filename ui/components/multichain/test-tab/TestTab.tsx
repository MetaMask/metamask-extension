import React from 'react';
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import Box from '../../ui/box/box';
import { Button } from '../../component-library';

export const TestTab = () => {
  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      'ActivityDataService:getActivity',
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ],
    getNextPageParam: ({ pageInfo }) =>
      pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
  });

  const query = useQuery({
    queryKey: [
      'AssetDataService:getAssets',
      [
        'eip155:1/slip44:60',
        'bip122:000000000019d6689c085ae165831e93/slip44:0',
        'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
      ],
    ],
  });

  const handleFetchNextPage = () => {
    infiniteQuery.fetchNextPage();
  };

  return (
    <Box>
      {infiniteQuery.status} {JSON.stringify(infiniteQuery.data)}
      <Button onClick={handleFetchNextPage}>Next Page</Button>
      {query.status} {JSON.stringify(query.data)}
    </Box>
  );
};
