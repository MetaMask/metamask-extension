import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncSeedPhrases } from '../../store/actions';
import { isSocialLoginFlow } from '../../selectors';

export const useSyncSRPs = () => {
  const dispatch = useDispatch();
  const isSocialLoginEnabled = useSelector(isSocialLoginFlow);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (isSocialLoginEnabled) {
          await dispatch(syncSeedPhrases());
        }
      } catch (error) {
        console.error('[useSyncSRPs] error', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, isSocialLoginEnabled]);

  return { loading };
};
