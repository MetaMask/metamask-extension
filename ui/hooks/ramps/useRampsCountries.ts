import { useSelector } from 'react-redux';
import { type Country } from '@metamask/ramps-controller';
import { selectCountries } from '../../selectors/rampsController';
import { parseUserFacingError } from './utils/parseUserFacingError';

export type UseRampsCountriesResult = {
  countries: Country[];
  isLoading: boolean;
  error: string | null;
};

export function useRampsCountries(): UseRampsCountriesResult {
  const countriesState = useSelector(selectCountries);
  const { data: countries, isLoading, error } = countriesState;

  return {
    countries,
    isLoading,
    error: error
      ? parseUserFacingError(countriesState, 'Failed to load countries')
      : null,
  };
}

export default useRampsCountries;
