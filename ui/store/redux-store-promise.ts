import type { Store } from 'redux';
import { withResolvers } from '../../shared/lib/promise-with-resolvers';
import type { MetaMaskReduxState } from './store';

type ReduxStore = Store<MetaMaskReduxState>;

const reduxStore = withResolvers<ReduxStore>();

/**
 * Returns a promise that resolves to the Redux store once the UI has started.
 *
 * Needed by the UI-side streaming PerpsController (getPerpsController.ts)
 * which bridges RemoteFeatureFlagController and AccountTreeController state
 * from Redux into its stub messenger for WebSocket subscriptions. The main
 * PerpsController now runs in the background and doesn't need this, but the
 * lightweight streaming instance may be initialized before the store is
 * available (e.g. via PerpsStreamManager.init without an explicit store arg).
 */
export function getReduxStorePromise(): Promise<ReduxStore> {
  return reduxStore.promise;
}

/**
 * Resolve the deferred Redux store promise. Called once during UI startup
 * after `configureStore` returns.
 *
 * @param store - The configured Redux store.
 */
export function resolveReduxStore(store: ReduxStore): void {
  reduxStore.resolve(store);
}
