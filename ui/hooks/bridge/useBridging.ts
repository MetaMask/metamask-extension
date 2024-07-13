import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchBridgeFeatureFlags } from '../../pages/bridge/bridge.util';
import { setBridgeFeatureFlags } from '../../store/actions';

const useBridging = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    fetchBridgeFeatureFlags().then((bridgeFeatureFlags) => {
      dispatch(setBridgeFeatureFlags(bridgeFeatureFlags));
    });
  }, [dispatch, setBridgeFeatureFlags]);
};
export default useBridging;
