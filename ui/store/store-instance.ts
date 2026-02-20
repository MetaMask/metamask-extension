import type { Store } from 'redux';

let storeInstance: Store | null = null;

/**
 * Sets the Redux store reference for use outside of React/thunk context.
 * Must be called once during app initialization, before any code that
 * relies on `getStoreInstance`.
 */
export function setStoreInstance(store: Store): void {
  storeInstance = store;
}

/**
 * Returns the Redux store instance. Throws if called before initialization.
 */
export function getStoreInstance(): Store {
  if (!storeInstance) {
    throw new Error(
      'Redux store not initialized. Call setStoreInstance() first.',
    );
  }
  return storeInstance;
}
