import deepEqual from 'fast-deep-equal';
import { useEffect, useState, useRef } from 'react';
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
  const [data, setData] = useState(undefined);
  const transactionRef = useRef(transaction);

  // The transaction object reference is often changed even though the contents arent.
  // This is a way of only updating our effect once an actual value changes in the object
  if (!deepEqual(transactionRef.current, transaction)) {
    transactionRef.current = transaction;
  }

  useEffect(() => {
    async function fetchInsight() {
      const d = await handleSnapRequest({
        snapId,
        origin: '',
        handler: 'onTransaction',
        request: {
          jsonrpc: '2.0',
          method: ' ',
          params: { transaction: transactionRef.current, chainId },
        },
      });
      setData(d);
    }
    if (transactionRef.current) {
      fetchInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapId, transactionRef.current, chainId]);

  return data;
}
