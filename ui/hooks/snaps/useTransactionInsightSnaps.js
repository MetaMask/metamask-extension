import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTransactionOriginCaveat } from '@metamask/snaps-rpc-methods';
import { SeverityLevel } from '@metamask/snaps-sdk';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjectsDeepEqual } from '../../selectors';

const INSIGHT_PERMISSION = 'endowment:transaction-insight';

export function useTransactionInsightSnaps({
  transaction,
  chainId,
  origin,
  insightSnaps,
}) {
  const subjects = useSelector(getPermissionSubjectsDeepEqual);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);
  const [hasFetchedInsight, setHasFetchedInsight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsight() {
      if (hasFetchedInsight) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const newData = await Promise.allSettled(
        insightSnaps.map((snapId) => {
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
        const snapId = insightSnaps[idx];
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
        setHasFetchedInsight(true);
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
    chainId,
    origin,
    subjects,
    // TODO: Figure out how to improve this
    JSON.stringify(insightSnaps),
    hasFetchedInsight,
  ]);

  const warnings = data?.reduce((warningsArr, promise) => {
    if (promise.response?.severity === SeverityLevel.Critical) {
      const {
        snapId,
        response: { id },
      } = promise;
      warningsArr.push({ snapId, id });
    }
    return warningsArr;
  }, []);

  return { data, loading, warnings };
}
