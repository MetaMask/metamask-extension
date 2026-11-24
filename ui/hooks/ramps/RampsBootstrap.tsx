import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUserRegion } from '../../selectors/rampsController';
import { getRampsTokens } from '../../store/controller-actions/ramps-controller';
import useRampsProviders from './useRampsProviders';
import useRampsPaymentMethods from './useRampsPaymentMethods';
import { useRampsOrderSyncing } from './useRampsOrderSyncing/useRampsOrderSyncing';

function RampsBootstrap(): null {
  useRampsProviders({ enableSideEffects: true });
  useRampsPaymentMethods();
  const { dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing } =
    useRampsOrderSyncing();

  const userRegion = useSelector(selectUserRegion);
  useEffect(() => {
    if (userRegion?.regionCode) {
      getRampsTokens(userRegion.regionCode, 'buy');
    }
  }, [userRegion?.regionCode]);

  useEffect(() => {
    if (shouldDispatchRampsOrderSyncing) {
      dispatchRampsOrderSyncing();
    }
  }, [shouldDispatchRampsOrderSyncing, dispatchRampsOrderSyncing]);

  return null;
}

export default RampsBootstrap;
