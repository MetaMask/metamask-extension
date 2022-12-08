import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTransactionOriginCaveat } from '@metamask/snaps-controllers';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjects } from '../../selectors';

const INSIGHT_PERMISSION = 'endowment:transaction-insight';

export function useTransactionInsightSnap({
  transaction,
  chainId,
  origin,
  snapId,
}) {
  const subjects = useSelector(getPermissionSubjects);
  const permission = subjects[snapId]?.permissions[INSIGHT_PERMISSION];
  if (!permission) {
    throw new Error(
      'This snap does not have the transaction insight endowment.',
    );
  }

  const hasTransactionOriginCaveat = getTransactionOriginCaveat(permission);
  const transactionOrigin = hasTransactionOriginCaveat ? origin : null;

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
            params: { transaction, chainId, transactionOrigin },
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
  }, [snapId, transaction, chainId, transactionOrigin]);

  return { data, error, loading };
}
