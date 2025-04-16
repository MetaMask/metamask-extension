import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  forceUpdateMetamaskState,
  handleSnapRequest,
} from '../../store/actions';

export function useSnapSettings({ snapId }: { snapId?: string }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ id: string } | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchPage(id: string) {
      try {
        setError(undefined);
        setLoading(true);

        const newData = (await handleSnapRequest({
          snapId: id,
          origin: 'metamask',
          handler: 'onSettingsPage',
          request: {
            jsonrpc: '2.0',
            method: ' ',
          },
        })) as { id: string };
        if (!cancelled) {
          setData(newData);
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          forceUpdateMetamaskState(dispatch);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (snapId) {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchPage(snapId);
    }

    return () => {
      cancelled = true;
    };
  }, [snapId]);

  return { data, error, loading };
}
