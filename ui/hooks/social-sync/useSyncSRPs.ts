import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import { syncSeedPhrases } from '../../store/actions';
import { getIsSocialLoginFlow } from '../../selectors';

export const useSyncSRPs = () => {
  const dispatch = useDispatch();
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isSocialLoginFlow) {
        return;
      }

      try {
        setLoading(true);
        await dispatch(syncSeedPhrases());
      } catch (error) {
        log.error('[useSyncSRPs] error', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, isSocialLoginFlow]);

  return { loading };
};
