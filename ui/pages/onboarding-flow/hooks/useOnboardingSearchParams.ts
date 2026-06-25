import { useLocation } from 'react-router-dom';

/**
 * Parses the two query-params that are threaded through every onboarding SRP
 * backup route so consuming components don't each have to repeat the
 * `new URLSearchParams(search).get(...)` boilerplate.
 *
 * Returns `isFromReminder` (truthy when the user arrived via the SRP backup
 * reminder flow), `isFromSettingsSecurity` (truthy when from the Security &
 * Privacy settings page), and `nextRouteQueryString` (pre-built query string
 * that forwards both params to the next route, empty when neither is present).
 */
export function useOnboardingSearchParams() {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');

  const forwardParams = new URLSearchParams();
  if (isFromReminder) {
    forwardParams.set('isFromReminder', isFromReminder);
  }
  if (isFromSettingsSecurity) {
    forwardParams.set('isFromSettingsSecurity', isFromSettingsSecurity);
  }
  const nextRouteQueryString = forwardParams.toString();

  return { isFromReminder, isFromSettingsSecurity, nextRouteQueryString };
}
