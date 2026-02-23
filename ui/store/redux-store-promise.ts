import type { Store } from 'redux';
import { withResolvers } from '../../shared/lib/promise-with-resolvers';
import type { MetaMaskReduxState } from './store';

type ReduxStore = Store<MetaMaskReduxState>;

const reduxStore = withResolvers<ReduxStore>();

/**
 * Returns a promise that resolves to the Redux store once the UI has started.
 * Used by modules that need the store but may run before it is passed in
 * (e.g. PerpsController init).
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
