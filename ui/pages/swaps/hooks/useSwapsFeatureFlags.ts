import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSwapsLivenessAndFeatureFlags } from '../../../ducks/swaps/swaps';

export function useSwapsFeatureFlags() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSwapsLivenessAndFeatureFlagsWrapper = async () => {
      await dispatch(fetchSwapsLivenessAndFeatureFlags());
    };
    fetchSwapsLivenessAndFeatureFlagsWrapper();
  }, [dispatch]);
}
