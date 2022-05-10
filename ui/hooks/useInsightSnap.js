import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getPermissionSubjects, getSnaps } from '../selectors';
import { invokeSnap } from '../store/actions';

const INSIGHT_PERMISSION = 'endowment:tx-insight';
const INSIGHT_METHOD = 'getInsight';

export function useInsightSnap(transaction) {
  const snaps = useSelector(getSnaps);
  const subjects = useSelector(getPermissionSubjects);
  const snapIds = Object.keys(snaps).filter((snapId) =>
    Boolean(subjects[snapId]?.permissions[INSIGHT_PERMISSION]),
  );
  const [data, setData] = useState(null);
  useEffect(() => {
    async function fetch() {
      const snapId = snapIds[0];
      const d = await invokeSnap(snapId, {
        method: INSIGHT_METHOD,
        params: [transaction],
      });
      setData(d);
    }
    if (snapIds.length > 0) {
      fetch();
    }
  }, [transaction]);

  return data;
}
