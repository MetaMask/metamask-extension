import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSwapsLivenessAndFeatureFlags } from '../../../ducks/swaps/swaps';

export function useSwapsFeatureFlags() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSwapsLivenessAndFeatureFlagsWrapper = async () => {
      await dispatch(fetchSwapsLivenessAndFeatureFlags());
    };
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchSwapsLivenessAndFeatureFlagsWrapper();
  }, [dispatch]);
}
