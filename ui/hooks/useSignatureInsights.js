import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSignatureOriginCaveat } from '@metamask/snaps-controllers';
import { handleSnapRequest } from '../store/actions';
import {
  getSignatureInsightSnapIds,
  getPermissionSubjectsDeepEqual,
} from '../selectors';

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

      const {
        msgParams: { from, data: msgData, signatureMethod, origin },
      } = txData;

      const shouldParse =
        signatureMethod === 'eth_signTyepdData_v3' ||
        signatureMethod === 'eth_signTypedData_v4';

      const signature = {
        from,
        data: shouldParse ? JSON.parse(msgData) : msgData,
        signatureMethod,
      };

      const newData = await Promise.allSettled(
        snapIds.map((snapId) => {
          const permission =
            subjects[snapId]?.permissions[SIGNATURE_INSIGHT_PERMISSION];
          if (!permission) {
            return Promise.reject(
              new Error(
                'This Snap does not have the signature insight endowment.',
              ),
            );
          }

          const hasSignatureOriginCaveat = getSignatureOriginCaveat(permission);
          const signatureOrigin = hasSignatureOriginCaveat ? origin : null;
          return handleSnapRequest({
            snapId,
            origin: '',
            handler: 'onSignature',
            request: {
              jsonrpc: '2.0',
              method: '',
              params: { signature, signatureOrigin },
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
  }, [txData, snapIds, subjects]);

  return { data, loading };
}
