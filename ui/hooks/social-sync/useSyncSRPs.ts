import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { syncSeedPhrases } from '../../store/actions';
import { getIsSocialLoginFlow } from '../../selectors';
import { useAppDispatch } from '../../store/hooks';

export const useSyncSRPs = () => {
  const dispatch = useAppDispatch();
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
