import { useEffect, useState } from 'react';
import {
  getGatorPermissionTokenInfo,
  GatorTokenInfo,
} from '../../../shared/lib/gator-permissions-utils';

export function useGatorTokenInfo(
  permissionType: string,
  chainId: string,
  tokenAddress: string,
) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<GatorTokenInfo | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchGatorTokenInfo() {
      try {
        setError(undefined);
        setLoading(true);

        const newData = await getGatorPermissionTokenInfo({
          permissionType: permissionType,
          chainId: chainId,
          tokenAddress: tokenAddress,
          allowExternalServices: true,
        });
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

    fetchGatorTokenInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading };
}
