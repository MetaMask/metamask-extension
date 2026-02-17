import { createContext, useCallback, useContext } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import type { StateSubscriptionService } from '../store/state-subscription-service';

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
 * the **specified** controller changes — not on every state dispatch.
 *
 * @param controllerName - The controller to subscribe to
 *   (e.g., `'PreferencesController'`).
 * @param selector - Extracts the desired slice from the controller's state.
 * @param isEqual - Optional equality function for the selected value.
 *   Defaults to `Object.is` (reference equality). Supply a custom comparator
 *   for selectors that return new object references on every call.
 * @returns The selected value from the controller's current state.
 * @example
 * ```ts
 * const currentLocale = useControllerState(
 *   'PreferencesController',
 *   (state) => state.currentLocale,
 * );
 * ```
 */
export function useControllerState<S extends Record<string, unknown>, R>(
  controllerName: string,
  selector: (state: S) => R,
  isEqual?: (a: R, b: R) => boolean,
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
    isEqual,
  );
}

/**
 * Subscribe to the full state of a single controller.
 * Convenience overload when no selector is needed.
 *
 * @param controllerName - The controller to subscribe to.
 * @returns The controller's full current state.
 */
export function useControllerFullState<S extends Record<string, unknown>>(
  controllerName: string,
): S {
  return useControllerState<S, S>(controllerName, identity as (s: S) => S);
}

function identity<T>(x: T): T {
  return x;
}
