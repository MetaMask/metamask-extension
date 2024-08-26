import { maskObject } from '../../../shared/modules/object.utils';
import ExtensionPlatform from '../platforms/extension';
import { SENTRY_BACKGROUND_STATE } from '../constants/sentry-state';
import LocalStore from './local-store';
import ReadOnlyNetworkStore from './network-store';

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
 * Get a state snapshot for Sentry. This is used to add additional context to
 * error reports, and it's used when processing errors and breadcrumbs to
 * determine whether the user has opted into Metametrics.
 *
 * This uses the persisted state pre-initialization, and the in-memory state
 * post-initialization. In both cases the state is anonymized.
 *
 * @returns A Sentry state snapshot.
 */
globalThis.stateHooks.getSentryState = function () {
  const sentryState = {
    browser: window.navigator.userAgent,
    // we use the manifest.json version from getVersion and not
    // `process.env.METAMASK_VERSION` as they can be different (see `getVersion`
    // for more info)
    version: platform.getVersion(),
  };
  // If `getSentryAppState` is set, it implies that initialization has completed
  if (globalThis.stateHooks.getSentryAppState) {
    sentryLocalStore.cleanUpMostRecentRetrievedState();
    return {
      ...sentryState,
      state: globalThis.stateHooks.getSentryAppState(),
    };
  } else if (
    // This is truthy if Sentry has retrieved state at least once already. This
    // should always be true when getting context for an error report, but can
    // be unset when Sentry is performing the opt-in check.
    sentryLocalStore.mostRecentRetrievedState ||
    // This is only set in the background process.
    globalThis.stateHooks.getMostRecentPersistedState
  ) {
    const persistedState =
      sentryLocalStore.mostRecentRetrievedState ||
      globalThis.stateHooks.getMostRecentPersistedState();
    // This can be unset when this method is called in the background for an
    // opt-in check, but the state hasn't been loaded yet.
    if (persistedState) {
      return {
        ...sentryState,
        persistedState: maskObject(persistedState, persistedStateMask),
      };
    }
  }
  // This branch means that local storage has not yet been read, so we have
  // no choice but to omit the application state.
  // This should be unreachable when getting context for an error report, but
  // can be false when Sentry is performing the opt-in check.
  return sentryState;
};
