import { maskObject } from '../../../shared/modules/object.utils';
import { SENTRY_BACKGROUND_STATE } from './setupSentry';

export function setupInitialStateHooks({ localStore, platform }) {
  globalThis.stateHooks.getPersistedState = async function () {
    return await localStore.get();
  };

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
    }
    return {
      ...sentryState,
      persistedState: maskObject(localStore.mostRecentRetrievedState, {
        data: SENTRY_BACKGROUND_STATE,
        meta: {
          version: true,
        },
      }),
    };
  };
}
