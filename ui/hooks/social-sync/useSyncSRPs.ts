import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncSeedPhrases } from '../../store/actions';
import { getIsSocialLoginFlow } from '../../selectors';

export const useSyncSRPs = () => {
  const dispatch = useDispatch();
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSocialLoginEnabled) {
      return;
    }

    (async () => {
      try {
        setLoading(true);
        await dispatch(syncSeedPhrases());
      } catch (error) {
        console.error('[useSyncSRPs] error', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, isSocialLoginEnabled]);

  return { loading };
};
