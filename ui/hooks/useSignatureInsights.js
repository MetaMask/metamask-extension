import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSignatureOriginCaveat } from '@metamask/snaps-controllers';
import { handleSnapRequest } from '../../store/actions';
import { getPermissionSubjectsDeepEqual } from '../../selectors';
import { getSignatureInsightSnapIds } from '../selectors';

const SIGNATURE_INSIGHT_PERMISSION = 'endowment:signature-insight';

export function useSignatureInsights({ txData }) {
  const subjects = useSelector(getPermissionSubjectsDeepEqual);
  const snapIds = useSelector(getSignatureInsightSnapIds);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsight() {
      setLoading(true);

      const newData = await Promise.allSettled(
        snapIds.map((snapId) => {
          const permission = subjects[snapId]?.permissions[SIGNATURE_INSIGHT_PERMISSION];
          if (!permission) {
            return Promise.reject(
              new Error(
                'This Snap does not have the signature insight endowment.',
              ),
            );
          }

          const hasSignatureOriginCaveat =
            getSignatureOriginCaveat(permission);
          const signatureOrigin = hasSignatureOriginCaveat ? origin : null;
          return handleSnapRequest({
            snapId,
            origin: '',
            handler: 'onSignature',
            request: {
              jsonrpc: '2.0',
              method: '',
              params: { transaction, chainId, signatureOrigin },
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
      }
    }
    if (txData) {
      fetchInsight();
    }
    return () => {
      cancelled = true;
    };
  }, [
    txData,
    origin,
    subjects,
    // TODO: Figure out how to improve this
    JSON.stringify(snapIds),
  ]);

  return { data, loading };
}
