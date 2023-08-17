import { maskObject } from '../../../shared/modules/object.utils';
import ExtensionPlatform from '../platforms/extension';
import LocalStore from './local-store';
import ReadOnlyNetworkStore from './network-store';
import { SENTRY_BACKGROUND_STATE } from './setupSentry';

const platform = new ExtensionPlatform();
const localStore = process.env.IN_TEST
  ? new ReadOnlyNetworkStore()
  : new LocalStore();

/**
 * Get the persisted wallet state.
 *
 * @returns The persisted wallet state.
 */
globalThis.stateHooks.getPersistedState = async function () {
  return await localStore.get();
};

const persistedStateMask = {
  data: SENTRY_BACKGROUND_STATE,
  meta: {
    version: true,
  },
};

/**
 * Get a state snapshot to include with Sentry error reports. This uses the
 * persisted state pre-initialization, and the in-memory state post-
 * initialization. In both cases the state is anonymized.
 *
 * @returns A Sentry state snapshot.
 */
globalThis.stateHooks.getSentryState = function () {
  const sentryState = {
    browser: window.navigator.userAgent,
    version: platform.getVersion(),
  };
  if (globalThis.stateHooks.getSentryAppState) {
    return {
      ...sentryState,
      state: globalThis.stateHooks.getSentryAppState(),
    };
  } else if (globalThis.stateHooks.getMostRecentPersistedState) {
    const persistedState = globalThis.stateHooks.getMostRecentPersistedState();
    if (persistedState) {
      return {
        ...sentryState,
        persistedState: maskObject(
          // `getMostRecentPersistedState` is used here instead of
          // `getPersistedState` to avoid making this an asynchronous function.
          globalThis.stateHooks.getMostRecentPersistedState(),
          persistedStateMask,
        ),
      };
    }
    return sentryState;
  }
  return sentryState;
};
