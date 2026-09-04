import { DEFAULT_ROUTE } from '../constants/routes';

type RedirectState =
  | {
      from?: {
        pathname?: string;
        search?: string;
        hash?: string;
      };
    }
  | null
  | undefined;

/**
 * Rebuilds the route the user was heading to before being redirected to the
 * unlock or onboarding screen.
 *
 * `RequireAuthenticated` stores the whole intended location in
 * `location.state.from`, so the hash must be carried through: deep links use it
 * as a scroll target (e.g. `/settings/privacy#metametrics`, resolved by
 * `SettingsTab`). Rebuilding only `pathname + search` silently drops it.
 *
 * @param state - The `location.state` of the unlock/onboarding route.
 * @returns The intended route, or `DEFAULT_ROUTE` when there isn't one.
 */
export function getRedirectAfterUnlock(state: RedirectState): string {
  const from = state?.from;

  if (!from?.pathname) {
    return DEFAULT_ROUTE;
  }

  return from.pathname + (from.search ?? '') + (from.hash ?? '');
}
