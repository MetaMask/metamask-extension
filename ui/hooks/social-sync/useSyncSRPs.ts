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

    (async () => {
      try {
        setLoading(true);
        // TODO: Fix Redux dispatch typing - implement useAppDispatch pattern
        // Discussion: https://github.com/MetaMask/metamask-extension/pull/32052#discussion_r2195789610
        // Solution: Update MetaMaskReduxDispatch type to properly handle async thunks
        // Extract thunk dispatch calls to separate issue - these are TypeScript/ESLint typing issues
        // eslint-disable-next-line @typescript-eslint/await-thenable
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
