import { createContext, useContext } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import type { StateSubscriptionService } from '../store/state-subscription-service';
import type { StateConstraint } from '@metamask/base-controller';

/**
 * React context that provides the {@link StateSubscriptionService} singleton.
 * Must wrap the component tree (typically in `ui/index.js` alongside the Redux
 * Provider).
 */
export const StateSubscriptionServiceContext =
  createContext<StateSubscriptionService | null>(null);

/**
 * Subscribe to a single controller's state via `useSyncExternalStore`.
 *
 * Components using this hook only re-render when the **selected** value from
 * the **specified** controller changes (by reference, via `Object.is`) — not
 * on every state dispatch.
 *
 * For selectors that derive new object references (`.filter()`, `.map()`),
 * wrap them with `createSelector` from reselect to memoize at the input level.
 * Immer's structural sharing ensures unchanged subtrees keep their references,
 * so `createSelector` short-circuits without running the transform.
 *
 * @param controllerName - The controller to subscribe to
 *   (e.g., `'PreferencesController'`).
 * @param selector - Extracts the desired slice from the controller's state.
 *   Use `createSelector` for derived values that produce new references.
 * @returns The selected value from the controller's current state.
 * @example
 * ```ts
 * // Direct property — reference equality sufficient
 * const currentLocale = useControllerState(
 *   'PreferencesController',
 *   (state) => state.currentLocale,
 * );
 *
 * // Derived value — createSelector memoizes at the input level
 * const selectActiveTokens = createSelector(
 *   (state: TokensControllerState) => state.tokens,
 *   (tokens) => tokens.filter(t => t.isActive),
 * );
 * const activeTokens = useControllerState('TokensController', selectActiveTokens);
 * ```
 */
export function useControllerState<S extends StateConstraint, R>(
  controllerName: string,
  selector: (state: S) => R,
): R {
  const service = useContext(StateSubscriptionServiceContext);
  if (!service) {
    throw new Error(
      'useControllerState: StateSubscriptionServiceContext is not provided. ' +
        'Wrap your component tree with StateSubscriptionServiceContext.Provider.',
    );
  }

  const proxy = service.getProxy<S>(controllerName);

  // `proxy.subscribe` and `proxy.getSnapshot` are arrow function class
  // properties — their references are stable across renders, so
  // useSyncExternalStore won't re-subscribe unnecessarily.
  return useSyncExternalStoreWithSelector(
    proxy.subscribe,
    proxy.getSnapshot,
    proxy.getSnapshot, // getServerSnapshot — same as getSnapshot (no SSR)
    selector,
  );
}

/**
 * Subscribe to the full state of a single controller.
 * Convenience overload when no selector is needed.
 *
 * @param controllerName - The controller to subscribe to.
 * @returns The controller's full current state.
 */
export function useControllerFullState<S extends StateConstraint>(
  controllerName: string,
): S {
  return useControllerState<S, S>(controllerName, identity as (s: S) => S);
}

function identity<T>(x: T): T {
  return x;
}
