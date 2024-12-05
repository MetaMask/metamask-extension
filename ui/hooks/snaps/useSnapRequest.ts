import { HandlerType } from '@metamask/snaps-utils';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  forceUpdateMetamaskState,
  handleSnapRequest,
} from '../../store/actions';

type SnapRequest = {
  snapId: string;
  handler: HandlerType;
  request: {
    method: string;
    params?: Record<string, unknown>;
  };
};

export const useSnapRequest = (request: SnapRequest) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown | undefined>(undefined);
  const [error, setError] = useState<unknown | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setError(undefined);
        setLoading(true);

        const newData = await handleSnapRequest({
          ...request,
          origin: '',
          request: {
            jsonrpc: '2.0',
            ...request.request,
          },
        });

        if (!cancelled) {
          setData(newData);
          forceUpdateMetamaskState(dispatch);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [request]);

  return { loading, data, error };
};
