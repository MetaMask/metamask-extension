import { useContext, useEffect, useState } from 'react';
import { DataServiceContext, Key } from './DataServiceProvider';

export function useDataService({ key }: { key: Key }) {
  const { fetchKey, subscribe, unsubscribe, get } =
    useContext(DataServiceContext);

  const [entry, setEntry] = useState(() => get(key) ?? { status: 'pending' });

  useEffect(() => {
    // Send requests to background on mount
    subscribe(key, setEntry).then((state) => {
      if (!state) {
        fetchKey(key).catch(console.error);
      }
    });

    return () => {
      unsubscribe(key, setEntry).catch(console.error);
    };
  }, []);

  return entry;
}
