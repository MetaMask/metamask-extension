import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSwapsLivenessAndFeatureFlags } from '../../../ducks/swaps/swaps';

export function useSwapsFeatureFlags() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSwapsLivenessAndFeatureFlagsWrapper = async () => {
      // TODO: Fix Redux dispatch typing - implement useAppDispatch pattern
      // Discussion: https://github.com/MetaMask/metamask-extension/pull/32052#discussion_r2195789610
      // Solution: Update MetaMaskReduxDispatch type to properly handle async thunks
      // Extract thunk dispatch calls to separate issue - these are TypeScript/ESLint typing issues
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await dispatch(fetchSwapsLivenessAndFeatureFlags());
    };
    fetchSwapsLivenessAndFeatureFlagsWrapper();
  }, [dispatch]);
}
