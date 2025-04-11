import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { fetchSwapsLivenessAndFeatureFlags } from '../../../ducks/swaps/swaps';

export function useSwapsFeatureFlags() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSwapsLivenessAndFeatureFlagsWrapper = async () => {
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await dispatch(fetchSwapsLivenessAndFeatureFlags());
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
    fetchSwapsLivenessAndFeatureFlagsWrapper();
  }, [dispatch]);
}
