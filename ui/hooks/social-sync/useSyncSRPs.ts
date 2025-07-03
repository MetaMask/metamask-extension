import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
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

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        setLoading(true);
        await dispatch(syncSeedPhrases());
      } catch (error) {
        log.error('[useSyncSRPs] error', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, isSocialLoginEnabled]);

  return { loading };
};
