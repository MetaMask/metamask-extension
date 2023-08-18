import { maskObject } from '../../../shared/modules/object.utils';
import ExtensionPlatform from '../platforms/extension';
import LocalStore from './local-store';
import ReadOnlyNetworkStore from './network-store';
import { SENTRY_BACKGROUND_STATE } from './setupSentry';

const platform = new ExtensionPlatform();

// This instance of `localStore` is used by Sentry to get the persisted state
const sentryLocalStore = process.env.IN_TEST
  ? new ReadOnlyNetworkStore()
  : new LocalStore();

/**
 * Get the persisted wallet state.
 *
 * @returns The persisted wallet state.
 */
globalThis.stateHooks.getPersistedState = async function () {
  return await sentryLocalStore.get();
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
  // If `getSentryAppState` is set, it implies that initialization has completed
  if (globalThis.stateHooks.getSentryAppState) {
    return {
      ...sentryState,
      state: globalThis.stateHooks.getSentryAppState(),
    };
  } else if (
    // This is truthy if Sentry has retrieved state at least once already. This
    // should always be true because Sentry calls `getPersistedState` during
    // error processing (before this function is called) if `getSentryAppState`
    // hasn't been set yet.
    sentryLocalStore.mostRecentRetrievedState
  ) {
    return {
      ...sentryState,
      persistedState: maskObject(
        sentryLocalStore.mostRecentRetrievedState,
        persistedStateMask,
      ),
    };
  }
  // This branch means that local storage has not yet been read, so we have
  // no choice but to omit the application state.
  // This should be unreachable, unless an error was encountered during error
  // processing.
  return sentryState;
};
