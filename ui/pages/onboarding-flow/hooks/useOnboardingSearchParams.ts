import { useLocation } from 'react-router-dom';

/**
 * Query-params starting with `//` are protocol-relative URLs, which would take
 * the user out of the extension, so only single-slash in-app paths are honored.
 *
 * @param path - The candidate path read from the query-string.
 */
function isInAppPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//');
}

/**
 * Parses the query-params that are threaded through every onboarding SRP
 * backup route so consuming components don't each have to repeat the
 * `new URLSearchParams(search).get(...)` boilerplate.
 *
 * Returns `isFromReminder` (truthy when the user arrived via the SRP backup
 * reminder flow), `isFromSettingsSecurity` (truthy when from the Security &
 * Privacy settings page), `previousPage` (in-app path to return to when
 * leaving the flow, `null` when absent or not an in-app path), and
 * `nextRouteQueryString` (pre-built query string that forwards the params to
 * the next route, empty when none are present).
 */
export function useOnboardingSearchParams() {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');
  const previousPageParam = searchParams.get('previousPage');
  const previousPage =
    previousPageParam && isInAppPath(previousPageParam)
      ? previousPageParam
      : null;

  const forwardParams = new URLSearchParams();
  if (isFromReminder) {
    forwardParams.set('isFromReminder', isFromReminder);
  }
  if (isFromSettingsSecurity) {
    forwardParams.set('isFromSettingsSecurity', isFromSettingsSecurity);
  }
  if (previousPage) {
    forwardParams.set('previousPage', previousPage);
  }
  const nextRouteQueryString = forwardParams.toString();

  return {
    isFromReminder,
    isFromSettingsSecurity,
    previousPage,
    nextRouteQueryString,
  };
}
