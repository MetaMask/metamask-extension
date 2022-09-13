import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjects } from '../../selectors';

const INSIGHT_PERMISSION = 'endowment:tx-insight';

export function useTransactionInsightSnap(transaction, snapId) {
  const subjects = useSelector(getPermissionSubjects);
  if (!subjects[snapId]?.permissions[INSIGHT_PERMISSION]) {
    throw new Error(
      'This snap does not have the transaction insight endowment.',
    );
  }
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchInsight() {
      const d = await handleSnapRequest(snapId, undefined, 'onTransaction', {
        params: [transaction],
      });
      setData(d);
    }
    if (transaction) {
      fetchInsight();
    }
  }, [snapId, transaction]);

  return data;
}
