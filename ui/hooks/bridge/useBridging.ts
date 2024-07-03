import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setBridgeFeatureFlags } from '../../ducks/bridge/actions';

const useBridging = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setBridgeFeatureFlags());
  }, [dispatch, setBridgeFeatureFlags]);
};
export default useBridging;
