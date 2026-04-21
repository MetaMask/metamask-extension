import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { maskObject } from '../../../shared/lib/object.utils';
import ExtensionPlatform from '../platforms/extension';
import { SENTRY_BACKGROUND_STATE } from '../constants/sentry-state';
import { FixtureExtensionStore } from '../../../shared/lib/stores/fixture-extension-store';
import ExtensionStore from '../../../shared/lib/stores/extension-store';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { PersistenceManager } from '../../../shared/lib/stores/persistence-manager';
import { trackVaultCorruptionEvent } from './state-corruption/track-vault-corruption';
import { trackEarlySegmentEvent } from './segment/early-segment-tracking';

const platform = new ExtensionPlatform();

function createLocalStore() {
  const useFixtureStore =
    process.env.IN_TEST &&
    getManifestFlags().testing?.forceExtensionStore !== true;
  if (!useFixtureStore) {
    return new ExtensionStore();
  }
  // Use globalThis.self (not window) so this works in both the UI and the background/service worker, where window is undefined.
  const locationHref = globalThis.self?.location?.href;
  if (!locationHref) {
    throw new Error(
      'setup-initial-state-hooks: globalThis.self?.location?.href is not defined; expected to run in a document or service worker context.',
    );
  }
  const isBackground =
    getEnvironmentType(locationHref) === ENVIRONMENT_TYPE_BACKGROUND;
  return new FixtureExtensionStore({ initialize: isBackground });
}

const localStore = createLocalStore();

// Single PersistenceManager per context: one in background, one per UI context.
export const persistenceManager = new PersistenceManager({ localStore })
  .on('vaultCorruptionDetected', (payload) => {
    trackVaultCorruptionEvent(
      payload.backup,
      MetaMetricsEventName.VaultCorruptionDetected,
      payload.corruptionType,
    );
  })
  .on('splitStateMigrationSucceeded', (payload) => {
    trackEarlySegmentEvent({
      state: payload.state,
      event: MetaMetricsEventName.StateMigrationSucceeded,
      category: MetaMetricsEventCategory.StateMigration,
    });
  })
  .on('splitStateMigrationFailed', (payload) => {
    trackEarlySegmentEvent({
      state: payload.state,
      event: MetaMetricsEventName.StateMigrationFailed,
      category: MetaMetricsEventCategory.StateMigration,
    });
  });

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
