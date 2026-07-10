import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  ExecuteRequestOptions,
  type UserRegion,
} from '@metamask/ramps-controller';
import { selectUserRegion } from '../../selectors/rampsController';
import { setRampsUserRegion } from '../../store/controller-actions/ramps-controller';

export type UseRampsUserRegionResult = {
  userRegion: UserRegion | null;
  setUserRegion: (
    region: string,
    options?: ExecuteRequestOptions,
  ) => Promise<UserRegion | null>;
};

export function useRampsUserRegion(): UseRampsUserRegionResult {
  const userRegion = useSelector(selectUserRegion);

  const setUserRegion = useCallback(
    (region: string, options?: ExecuteRequestOptions) =>
      setRampsUserRegion(region, options),
    [],
  );

  return {
    userRegion,
    setUserRegion,
  };
}

export default useRampsUserRegion;
