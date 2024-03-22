import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSignatureOriginCaveat } from '@metamask/snaps-rpc-methods';
import { SeverityLevel } from '@metamask/snaps-sdk';
import { deleteInterface, handleSnapRequest } from '../../store/actions';
import {
  getSignatureInsightSnapIds,
  getPermissionSubjectsDeepEqual,
} from '../../selectors';

const SIGNATURE_INSIGHT_PERMISSION = 'endowment:signature-insight';

export function useSignatureInsights({ txData }) {
  const dispatch = useDispatch();
  const subjects = useSelector(getPermissionSubjectsDeepEqual);
  const snapIds = useSelector(getSignatureInsightSnapIds);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(undefined);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsight() {
      setLoading(true);

      const {
        msgParams: { from, data: msgData, signatureMethod, origin },
      } = txData;

      /**
       * Both eth_signTypedData_v3 and eth_signTypedData_v4 methods
       * need to be parsed because their data is stringified. All other
       * signature methods do not, so they are ignored.
       */
      const shouldParse =
        signatureMethod === 'eth_signTypedData_v3' ||
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

      const insightWarnings = reformattedData.reduce((warningsArr, promise) => {
        if (promise.response?.severity === SeverityLevel.Critical) {
          const {
            snapId,
            response: { id },
          } = promise;
          warningsArr.push({ snapId, id });
        }
        return warningsArr;
      }, []);

      if (!cancelled) {
        setData(reformattedData);
        setWarnings(insightWarnings);
        setLoading(false);
      }
    }
    if (Object.keys(txData).length > 0) {
      fetchInsight();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txData, JSON.stringify(snapIds), subjects]);

  useEffect(() => {
    return () => {
      data?.map(
        ({ response }) =>
          response?.id && dispatch(deleteInterface(response.id)),
      );
    };
  }, [data]);

  return { data, loading, warnings };
}
