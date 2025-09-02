import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import { syncSecretDataWithSocialLogin } from '../../store/actions';
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
        await dispatch(syncSecretDataWithSocialLogin());
      } catch (error) {
        log.error('[useSyncSRPs] error', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, isSocialLoginEnabled]);

  return { loading };
};
