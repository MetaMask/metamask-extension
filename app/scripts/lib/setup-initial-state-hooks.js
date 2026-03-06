import { memoize } from 'lodash';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { maskObject } from '../../../shared/modules/object.utils';
import ExtensionPlatform from '../platforms/extension';
import { SENTRY_BACKGROUND_STATE } from '../constants/sentry-state';
import { FixtureExtensionStore } from './stores/fixture-extension-store';
import ExtensionStore from './stores/extension-store';
import { PersistenceManager } from './stores/persistence-manager';

const platform = new ExtensionPlatform();

// TODO: This logic is duplicated from app/scripts/lib/util.ts getEnvironmentType.
// It should be extracted to a shared get-environment-type.ts module, but that
// causes a LavaMoat + Webpack harmony re-export error in the UI bundle. See:
// https://github.com/LavaMoat/LavaMoat/issues/1893
const getEnvironmentTypeMemo = memoize((url) => {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPE_POPUP;
  } else if (['/home.html'].includes(parsedUrl.pathname)) {
    return ENVIRONMENT_TYPE_FULLSCREEN;
  } else if (parsedUrl.pathname === '/notification.html') {
    return ENVIRONMENT_TYPE_NOTIFICATION;
  } else if (parsedUrl.pathname === '/sidepanel.html') {
    return ENVIRONMENT_TYPE_SIDEPANEL;
  }
  return ENVIRONMENT_TYPE_BACKGROUND;
});

const getEnvironmentTypeForHooks = (
  url = globalThis.self?.location?.href ?? '',
) => {
  // With Webpack the UI chunk can run before the page global has location set, so
  // url is empty; with Browserify the script runs in the page context and href is
  // set. Return null when unknown so we never treat the UI as background and use
  // FixtureExtensionStore(initialize: true) there, which would block on fetch.
  if (!url) {
    return null;
  }
  return getEnvironmentTypeMemo(url);
};

const useFixtureStore =
  process.env.IN_TEST &&
  getManifestFlags().testing?.forceExtensionStore !== true;
const isBackground =
  getEnvironmentTypeForHooks() === ENVIRONMENT_TYPE_BACKGROUND;
const localStore = useFixtureStore
  ? new FixtureExtensionStore({ initialize: isBackground })
  : new ExtensionStore();

// Single PersistenceManager per context: one in background, one per UI context.
export const persistenceManager = new PersistenceManager({ localStore });

/**
 * Get the persisted wallet state.
 *
 * @returns The persisted wallet state.
 */
globalThis.stateHooks.getPersistedState = async function () {
  return await persistenceManager.get({ validateVault: false });
};

/**
 * Get the backup state from IndexedDB.
 * This is used as a fallback when primary storage is unavailable.
 *
 * @returns The backup state, or null if unavailable.
 */
globalThis.stateHooks.getBackupState = async function () {
  return await persistenceManager.getBackup();
};

const persistedStateMask = {
  data: SENTRY_BACKGROUND_STATE,
  meta: {
    storageKind: true,
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
    persistenceManager.cleanUpMostRecentRetrievedState();
    return {
      ...sentryState,
      state: globalThis.stateHooks.getSentryAppState(),
    };
  } else if (
    // This is truthy if Sentry has retrieved state at least once already. This
    // should always be true when getting context for an error report, but can
    // be unset when Sentry is performing the opt-in check.
    persistenceManager.mostRecentRetrievedState ||
    // This is only set in the background process.
    globalThis.stateHooks.getMostRecentPersistedState
  ) {
    const persistedState =
      persistenceManager.mostRecentRetrievedState ||
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
