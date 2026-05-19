import { useSelector } from 'react-redux';
import { selectPerpsIsEligible } from '../../selectors/perps-controller';

/**
 * Hook to read perps geo-blocking eligibility from background PerpsController state.
 * Re-renders when controller state.isEligible changes via Redux state sync.
 *
 * @returns isEligible - true if the user can trade/deposit/modify; false if geo-blocked
 */
export function usePerpsEligibility(): { isEligible: boolean } {
  const isEligible = useSelector(selectPerpsIsEligible);
  return { isEligible };
}
