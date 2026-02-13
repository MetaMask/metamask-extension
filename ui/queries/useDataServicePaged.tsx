import { useContext } from 'react';
import { DataServiceContext, Key } from './DataServiceProvider';
import { useDataService } from './useDataService';

export function useDataServicePaged({ key }: { key: Key }) {
  const data = useDataService({ key });

  const { fetchKey } = useContext(DataServiceContext);

  function fetchPreviousPage() {
    if (!data.hasPreviousPage) {
      return;
    }
    fetchKey(key, data.previousPage).catch(console.error);
  }

  function fetchNextPage() {
    if (!data.hasNextPage) {
      return;
    }
    fetchKey(key, data.nextPage).catch(console.error);
  }

  return { ...data, fetchPreviousPage, fetchNextPage };
}
