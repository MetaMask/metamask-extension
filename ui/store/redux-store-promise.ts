import type { Store } from 'redux';
import { withResolvers } from '../../shared/lib/promise-with-resolvers';
import type { MetaMaskReduxState } from './store';

type ReduxStore = Store<MetaMaskReduxState>;

const reduxStore = withResolvers<ReduxStore>();

/**
 * Returns a promise that resolves to the Redux store once the UI has started.
 *
 * Used by any module that needs the Redux store before the main UI initialization
 * sequence has completed (e.g. modules initialized before `configureStore` returns).
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
