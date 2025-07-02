import { useEffect, useState } from 'react';
import { enableGatorPermissions, fetchAndUpdateGatorPermissions } from '../../store/controller-actions/gator-permissions-controller';
import { GatorPermissionsList } from '@metamask/gator-permissions-controller';

export function useGatorPermissions() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<GatorPermissionsList | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchGatorPermissions() {
      try {
        console.log('useGatorPermissions: fetchGatorPermissions start');
        setError(undefined);
        setLoading(true);

        // First enable gator permissions
        await enableGatorPermissions();

        // Then fetch and update the permissions
        const newData = await fetchAndUpdateGatorPermissions();
        if (!cancelled) {
          setData(newData);
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
