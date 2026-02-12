import { useContext, useEffect } from 'react';
import { DataServiceContext, Key } from './DataServiceProvider';

export function useDataService({ key }: { key: Key }) {
  const { fetchKey, subscribe, unsubscribe, get } =
    useContext(DataServiceContext);

  useEffect(() => {
    // Send requests to background on mount
    subscribe(key).then((state) => {
      if (!state) {
        fetchKey(key).catch(console.error);
      }
    });

    return () => {
      unsubscribe(key).catch(console.error);
    };
  }, []);

  return get(key) ?? { status: 'pending' };
}
