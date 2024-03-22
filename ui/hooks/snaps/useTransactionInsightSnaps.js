import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTransactionOriginCaveat } from '@metamask/snaps-rpc-methods';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjectsDeepEqual } from '../../selectors';

const INSIGHT_PERMISSION = 'endowment:transaction-insight';

export function useTransactionInsightSnaps({
  transaction,
  chainId,
  origin,
  insightSnaps,
  eagerFetching = true,
  insightSnapId = '',
}) {
  const subjects = useSelector(getPermissionSubjectsDeepEqual);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const [hasFetchedV2Insight, setHasFetchedV2Insight] = useState(false);
  ///: END:ONLY_INCLUDE_IF
  useEffect(() => {
    let cancelled = false;

    async function fetchInsight() {
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      if (hasFetchedV2Insight) {
        setLoading(false);
        return;
      }
      ///: END:ONLY_INCLUDE_IF

      if (!eagerFetching) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const snapIds = insightSnapId.length > 0 ? [insightSnapId] : insightSnaps;

      const newData = await Promise.allSettled(
        snapIds.map((snapId) => {
          const permission = subjects[snapId]?.permissions[INSIGHT_PERMISSION];
          if (!permission) {
            return Promise.reject(
              new Error(
                'This Snap does not have the transaction insight endowment.',
              ),
            );
          }

          const hasTransactionOriginCaveat =
            getTransactionOriginCaveat(permission);
          const transactionOrigin = hasTransactionOriginCaveat ? origin : null;
          return handleSnapRequest({
            snapId,
            origin: '',
            handler: 'onTransaction',
            request: {
              jsonrpc: '2.0',
              method: '',
              params: { transaction, chainId, transactionOrigin },
            },
          });
        }),
      );

      const reformattedData = newData.map((promise, idx) => {
        const snapId = snapIds[idx];
        if (promise.status === 'rejected') {
          return {
            error: promise.reason,
            snapId,
          };
        }
        return {
          snapId,
          response: promise.value,
        };
      });

      if (!cancelled) {
        setData(reformattedData);
        setLoading(false);
        ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
        setHasFetchedV2Insight(true);
        ///: END:ONLY_INCLUDE_IF
      }
    }
    if (transaction && Object.keys(transaction).length > 0) {
      fetchInsight();
    }
    return () => {
      cancelled = true;
    };
  }, [
    transaction,
    eagerFetching,
    chainId,
    origin,
    subjects,
    // TODO: Figure out how to improve this
    JSON.stringify(insightSnaps),
    insightSnapId,
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    hasFetchedV2Insight,
    ///: END:ONLY_INCLUDE_IF
  ]);

  return { data, loading };
}
