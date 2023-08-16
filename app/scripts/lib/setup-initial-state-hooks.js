import { maskObject } from '../../../shared/modules/object.utils';
import { SENTRY_BACKGROUND_STATE } from './setupSentry';

export function setupInitialStateHooks({ localStore, platform }) {
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
    } else if (localStore.mostRecentRetrievedState) {
      return {
        ...sentryState,
        persistedState: maskObject(
          localStore.mostRecentRetrievedState,
          persistedStateMask,
        ),
      };
    }
    return sentryState;
  };
}
