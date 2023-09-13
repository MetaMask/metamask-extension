import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getNameLookupCaveat } from '@metamask/snaps-controllers';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjects } from '../../selectors';

const NAME_LOOKUP_PERMISSION = 'endowment:name-lookup';

export function useDomainResolution({ domain, address = '', type = 'normal' }) {
  const subjects = useSelector(getPermissionSubjects);
  const permission = subjects[snapId]?.permissions[NAME_LOOKUP_PERMISSION];
  if ()
  if (!permission) {
    throw new Error(
      'This snap does not have the transaction insight endowment.',
    );
  }

  const nameLookupCaveat = getNameLookupCaveat(permission);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    async function fetchInsight() {
      try {
        setError(undefined);
        setLoading(true);

        const newData = await handleSnapRequest({
          snapId,
          origin: '',
          handler: 'onTransaction',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: { transaction, chainId, transactionOrigin },
          },
        });
        if (!cancelled) {
          setData(newData);
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
    if (transaction) {
      fetchInsight();
    }
    return () => (cancelled = true);
  }, [snapId, transaction, chainId, transactionOrigin]);

  return { data, error, loading };
}
