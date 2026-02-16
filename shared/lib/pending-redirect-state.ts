import { EnvironmentType } from '../constants/app';

/**
 * Persisted redirect route for cross-session navigation.
 *
 * ## How it works
 *
 * `pendingRedirectRoute` is persisted in {@link AppStateController} (with
 * `persist: true`), so it survives popup closes and extension restarts.
 *
 * ### Flow
 *
 * 1. **Set** — A background service or UI component calls
 *    `setPendingRedirectRoute({ path, search?, environmentType? })` before
 *    an action that may close the popup.
 *
 * 2. **Redirect** — When the home page mounts, `checkPendingRedirectRoute()`
 *    reads the persisted value. If the optional `environmentType` matches the
 *    current environment (or is omitted), it hydrates the Redux-only
 *    `redirectAfterDefaultPage` in the history duck, which triggers navigation.
 *
 * 3. **Clear** — The home page always clears `pendingRedirectRoute` after
 *    reading it, regardless of whether the redirect fired. This prevents stale
 *    redirects from accumulating.
 *
 * ### Clearing on success or intentional navigation
 *
 * - On **success** (e.g. checkout completes): should call `setPendingRedirectRoute(null)` so no redirect occurs.
 * - On **intentional leave** (e.g. user presses back): should clear the route if it matches its own path.
 *
 * ## E.g
 *
 * ### From a background service (via messenger)
 *
 * ```ts
 * // Before opening an external tab
 * this.#messenger.call('AppStateController:setPendingRedirectRoute', {
 *   path: '/my-feature',
 *   environmentType: ENVIRONMENT_TYPE_POPUP, // optional
 * });
 *
 * // After the external flow completes successfully
 * this.#messenger.call('AppStateController:setPendingRedirectRoute', null);
 * ```
 *
 * ### From a UI component (via store action)
 *
 * ```ts
 * import { setPendingRedirectRoute } from '../../store/actions';
 *
 * // Set
 * dispatch(setPendingRedirectRoute({ path: '/my-feature', search: '?tab=2' }));
 *
 * // Clear
 * dispatch(setPendingRedirectRoute(null));
 * ```
 *
 * ### `environmentType` values
 *
 * - `'popup'` — Extension popup window
 * - `'fullscreen'` — Full browser tab
 * - `'sidepanel'` — Side panel
 * - `undefined` — Redirect fires in any environment (default)
 *
 * ## Related files
 *
 * - **State**: `app/scripts/controllers/app-state-controller.ts` — `setPendingRedirectRoute()`
 * - **Store action**: `ui/store/actions.ts` — `setPendingRedirectRoute()`
 * - **Selector**: `ui/selectors/selectors.js` — `getPendingRedirectRoute()`
 * - **Consumer**: `ui/pages/home/home.component.js` — `checkPendingRedirectRoute()`
 * - **History duck**: `ui/ducks/history/history.js` — `setRedirectAfterDefaultPage()`
 */
export type PendingRedirectRoute = {
  /** The route path to redirect to (e.g. `'/shield-plan'`). */
  path: string;
  /** Optional query string to append (e.g. `'?source=checkout'`). */
  search?: string;
  /**
   * If set, the redirect only fires when the extension is opened in this
   * environment type. If omitted, the redirect fires in any environment.
   */
  environmentType?: EnvironmentType;
};
