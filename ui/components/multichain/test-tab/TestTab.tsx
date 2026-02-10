import React from 'react';
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import Box from '../../ui/box/box';
import { Button } from '../../component-library';

export const TestTab = () => {
  const queryKey = [
    'ActivityDataService:getActivity',
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  ];

  const infiniteQuery = useInfiniteQuery({
    queryKey,
    getNextPageParam: ({ pageInfo }) =>
      pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
  });

  const query = useQuery({ queryKey });

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
