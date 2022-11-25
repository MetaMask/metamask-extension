import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjects } from '../../selectors';

const INSIGHT_PERMISSION = 'endowment:transaction-insight';

export function useTransactionInsightSnap({ transaction, chainId, snapId }) {
  const subjects = useSelector(getPermissionSubjects);
  if (!subjects[snapId]?.permissions[INSIGHT_PERMISSION]) {
    throw new Error(
      'This snap does not have the transaction insight endowment.',
    );
  }

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    async function fetchInsight() {
      try {
        setError(undefined);
        setLoading(true);

        const d = await handleSnapRequest({
          snapId,
          origin: '',
          handler: 'onTransaction',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: { transaction, chainId },
          },
        });
        setData(d);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    if (transaction) {
      fetchInsight();
    }
  }, [snapId, transaction, chainId]);

  return { data, error, loading };
}
