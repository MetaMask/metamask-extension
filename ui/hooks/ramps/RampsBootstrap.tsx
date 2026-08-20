import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUserRegion } from '../../selectors/rampsController';
import { getRampsTokens } from '../../store/controller-actions/ramps-controller';
import useRampsProviders from './useRampsProviders';
import useRampsPaymentMethods from './useRampsPaymentMethods';

function RampsBootstrap(): null {
  useRampsProviders({ enableSideEffects: true });
  useRampsPaymentMethods();

  const userRegion = useSelector(selectUserRegion);
  useEffect(() => {
    if (userRegion?.regionCode) {
      getRampsTokens(userRegion.regionCode, 'buy');
    }
  }, [userRegion?.regionCode]);

  return null;
}

export default RampsBootstrap;
