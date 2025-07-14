import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  enableGatorPermissions,
  fetchAndUpdateGatorPermissions,
} from '../../store/controller-actions/gator-permissions-controller';
import { GatorPermissionsList } from '@metamask/gator-permissions-controller';
import { forceUpdateMetamaskState } from '../../store/actions';

export function useGatorPermissions() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<GatorPermissionsList | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchGatorPermissions() {
      try {
        setError(undefined);
        setLoading(true);

        await enableGatorPermissions();
        const newData = await fetchAndUpdateGatorPermissions();
        if (!cancelled) {
          setData(newData);
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

    fetchGatorPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading };
}
