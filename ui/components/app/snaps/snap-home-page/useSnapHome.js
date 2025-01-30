import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  handleSnapRequest,
  forceUpdateMetamaskState,
} from '../../../../store/actions';

export function useSnapHome({ snapId }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchPage() {
      try {
        setError(undefined);
        setLoading(true);

        const newData = await handleSnapRequest({
          snapId,
          origin: '',
          handler: 'onHomePage',
          request: {
            jsonrpc: '2.0',
            method: ' ',
          },
        });
        if (!cancelled) {
          setData(newData);
          forceUpdateMetamaskState(dispatch);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchPage();
    return () => (cancelled = true);
  }, [snapId]);

  return { data, error, loading };
}
