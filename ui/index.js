import copyToClipboard from 'copy-to-clipboard';
import log from 'loglevel';
import React from 'react';
import { render } from 'react-dom';
import browser from 'webextension-polyfill';
import { captureException } from '../shared/lib/sentry';
import { withResolvers } from '../shared/lib/promise-with-resolvers';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../app/scripts/lib/util';
import { maskObject } from '../shared/modules/object.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { SENTRY_UI_STATE } from '../app/scripts/constants/sentry-state';
import { ENVIRONMENT_TYPE_POPUP } from '../shared/constants/app';
import { getBrowserName } from '../shared/modules/browser-runtime.utils';
import { COPY_OPTIONS } from '../shared/constants/copy';
import { START_UI_SYNC } from '../shared/constants/ui-initialization';
import { switchDirection } from '../shared/lib/switch-direction';
import { setupLocale } from '../shared/lib/error-utils';
import { trace, TraceName } from '../shared/lib/trace';
import * as actions from './store/actions';
import configureStore from './store/store';
import { setStoreInstance } from './store/store-instance';
import { StateSubscriptionService } from './store/state-subscription-service';
import {
  getNetworkToAutomaticallySwitchTo,
  getIsSocialLoginFlow,
  getFirstTimeFlowType,
} from './selectors';
import { getIsUnlocked } from './ducks/metamask/metamask';
import Root from './pages';
import { setBackgroundConnection } from './store/background-connection';
import { SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS } from './constants';

export { CriticalStartupErrorHandler } from './helpers/utils/critical-startup-error-handler';
export {
  displayCriticalErrorMessage,
  CriticalErrorTranslationKey,
} from './helpers/utils/display-critical-error';

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn', false);

/**
 * @type {PromiseWithResolvers<ReturnType<typeof configureStore>>}
 */
const reduxStore = withResolvers();

/**
 * Singleton that provides keyed per-controller state to components via
 * {@link useControllerState}. Initialized from `START_UI_SYNC` and updated
 * incrementally by `sendUpdate`.
 */
export const stateSubscriptionService = new StateSubscriptionService();

/**
 * Method to update backgroundConnection object use by UI
 *
 * @param backgroundConnection - connection object to background
 * @param handleStartUISync - function to call when startUISync notification is received
 */
export const connectToBackground = (
  backgroundConnection,
  handleStartUISync,
) => {
  setBackgroundConnection(backgroundConnection);
  backgroundConnection.onNotification(async (data) => {
    const { method } = data;
    if (method === 'sendUpdate') {
      const keyedPatches = data.params[0];
      stateSubscriptionService.applyBatch(keyedPatches);
      stateSubscriptionService.scheduleFlush();
    } else if (method === START_UI_SYNC) {
      await handleStartUISync(data.params[0]);
    } else {
      throw new Error(
        `Internal JSON-RPC Notification Not Handled:\n\n ${JSON.stringify(
          data,
        )}`,
      );
    }
  });
};

export async function launchMetamaskUi(opts) {
  const { backgroundConnection, initialState } = opts;

  const { isInitialized, ...controllers } = initialState;
  if (stateSubscriptionService.isInitialized) {
    stateSubscriptionService.reinitialize(controllers);
  } else {
    stateSubscriptionService.initialize(controllers);
  }

  const store = await startApp(initialState, opts);

  await backgroundConnection.startSendingPatches();

  setupStateHooks(store);

  return store;
}

/**
 * Method to setup initial redux store for the ui application.
 *
 * In Pure A2 the `metamask` Redux slice is removed. Controller state is
 * read directly from keyed `initialState` for one-time setup (locale,
 * text direction) and from {@link StateSubscriptionService} at runtime.
 *
 * @param {Record<string, unknown>} keyedState - Keyed background state
 *   (`{ isInitialized, PreferencesController, KeyringController, ... }`).
 * @param {*} activeTab - Active browser tab.
 * @returns Redux store (no longer contains a `metamask` slice).
 */
export async function setupInitialStore(keyedState, activeTab) {
  const prefs = keyedState.PreferencesController ?? {};

  if (!prefs.featureFlags) {
    prefs.featureFlags = {};
  }

  const { currentLocaleMessages, enLocaleMessages } = await setupLocale(
    prefs.currentLocale,
  );

  if (prefs.textDirection === 'rtl') {
    switchDirection('rtl');
  }

  const draftInitialState = {
    activeTab,

    // appState represents the current tab's popup state
    appState: {},

    localeMessages: {
      currentLocale: prefs.currentLocale,
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },
  };
  // TODO(A2): Unconnected-account alert and unapproved-tx redirect depend on
  // selectors that read `state.metamask`. These will be migrated to SSS
  // listeners in Epic 3. For now they are skipped — the runtime paths in
  // React components will handle them via useControllerState.

  const store = configureStore(draftInitialState);
  setStoreInstance(store);
  reduxStore.resolve(store);

  return store;
}

async function startApp(keyedState, opts) {
  const { traceContext } = opts;

  // TODO(A2): getStartupTraceTags reads state.metamask — migrate to SSS in Epic 3
  const tags = {};

  const store = await trace(
    {
      name: TraceName.SetupStore,
      parentContext: traceContext,
      tags,
    },
    () => setupInitialStore(keyedState, opts.activeTab),
  );

  // global metamask api - used by tooling
  global.metamask = {
    updateCurrentLocale: (code) => {
      store.dispatch(actions.updateCurrentLocale(code));
    },
    setFeatureFlag: (key, value) => {
      store.dispatch(actions.setFeatureFlag(key, value));
    },
  };

  await trace(
    { name: TraceName.InitialActions, parentContext: traceContext },
    () => runInitialActions(store),
  );

  trace({ name: TraceName.FirstRender, parentContext: traceContext }, () =>
    render(
      <Root
        store={store}
        stateSubscriptionService={stateSubscriptionService}
      />,
      opts.container,
    ),
  );

  return store;
}

async function runInitialActions(store) {
  const initialState = store.getState();

  // Update browser environment with accurate browser detection from UI
  // This corrects the initial detection from background which can't detect Brave
  try {
    const browserName = getBrowserName().toLowerCase();
    const { os } = initialState.metamask.browserEnvironment || {};
    if (os && browserName) {
      store
        .dispatch(actions.setBrowserEnvironment(os, browserName))
        .catch((err) => {
          log.error('Failed to update browser environment:', err);
        });
    }
  } catch (error) {
    log.error('Failed to get browser name:', error);
  }

  // This block autoswitches chains based on the last chain used
  // for a given dapp, when there are no pending confimrations
  // This allows the user to be connected on one chain
  // for one dapp, and automatically change for another
  const networkIdToSwitchTo = getNetworkToAutomaticallySwitchTo(initialState);

  if (networkIdToSwitchTo) {
    await store.dispatch(
      actions.automaticallySwitchNetwork(networkIdToSwitchTo),
    );
  }

  // Register this window as the current popup
  // and set in background state
  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
    const thisPopupId = Date.now();
    global.metamask.id = thisPopupId;
    await store.dispatch(actions.setCurrentExtensionPopupId(thisPopupId));
  }

  try {
    const validateSeedlessPasswordOutdated = async (state) => {
      const isUnlocked = getIsUnlocked(state);
      if (isUnlocked) {
        await store.dispatch(actions.checkIsSeedlessPasswordOutdated());
      }
    };
    await validateSeedlessPasswordOutdated(initialState);
    // periodically check seedless password outdated when app UI is open
    const pwdCheckIntervalId = setInterval(() => {
      const state = store.getState();
      const firstTimeFlowType = getFirstTimeFlowType(state);
      const isSocialLoginFlow = getIsSocialLoginFlow(state);
      if (firstTimeFlowType !== null && !isSocialLoginFlow) {
        // if the onboarding type is not social login, after wallet reset, we should stop checking for password outdated
        clearInterval(pwdCheckIntervalId);
        return;
      }
      validateSeedlessPasswordOutdated(state);
    }, SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS);
  } catch (e) {
    log.error('[Metamask] checkIsSeedlessPasswordOutdated error', e);
  }
}

export async function getCleanAppState(store) {
  const state = { ...store.getState() };
  // we use the manifest.json version from getVersion and not
  // `process.env.METAMASK_VERSION` as they can be different (see `getVersion`
  // for more info)
  state.version = global.platform.getVersion();
  state.browser = window.navigator.userAgent;

  // when JSON.stringiy, `undefined` value will be left out.
  state.metamask = {
    ...state.metamask,
    socialLoginEmail: undefined,
  };

  return state;
}

/**
 * Setup functions on `window.stateHooks`. Some of these support
 * application features, and some are just for debugging or testing.
 *
 * @param {object} store - The Redux store.
 */
function setupStateHooks(store) {
  if (
    process.env.METAMASK_DEBUG ||
    process.env.IN_TEST ||
    process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS
  ) {
    /**
     * The following stateHook is a method intended to throw an error, used in
     * manual and E2E tests to ensure that errors are attempted to be sent to sentry.
     *
     * @param {string} [msg] - The error message to throw, defaults to 'Test Error'
     */
    window.stateHooks.throwTestError = async function (msg = 'Test Error') {
      const error = new Error(msg);
      error.name = 'TestError';
      throw error;
    };
    /**
     * The following stateHook is a method intended to capture an error, used in
     * manual and E2E tests to ensure that errors are correctly sent to sentry.
     *
     * @param {string} [msg] - The error message to capture, defaults to 'Test Error'
     */
    window.stateHooks.captureTestError = async function (msg = 'Test Error') {
      const error = new Error(msg);
      error.name = 'TestError';
      captureException(error);
    };
    /**
     * The following stateHook is a method intended to throw an error in the
     * background, used in manual and E2E tests to ensure that errors are attempted to be
     * sent to sentry.
     *
     * @param {string} [msg] - The error message to throw, defaults to 'Test Error'
     */
    window.stateHooks.throwTestBackgroundError = async function (
      msg = 'Test Error',
    ) {
      await actions.throwTestBackgroundError(msg);
    };
    /**
     * The following stateHook is a method intended to capture an error in the background, used
     * in manual and E2E tests to ensure that errors are correctly sent to sentry.
     *
     * @param {string} [msg] - The error message to capture, defaults to 'Test Error'
     */
    window.stateHooks.captureBackgroundError = async function (
      msg = 'Test Error',
    ) {
      await actions.captureTestBackgroundError(msg);
    };
  }

  /**
   * Reload the extension.
   *
   * This is used for the `first-install` E2E test, which uses a production-like build. This
   * function must be present even if `process.env.IN_TEST` is false.
   */
  window.stateHooks.reloadExtension = () => {
    browser.runtime.reload();
  };
  window.stateHooks.getCleanAppState = async function () {
    const reduxState = store.getState();
    const controllerSnapshots = stateSubscriptionService.getAllSnapshots();
    return { ...reduxState, metamask: controllerSnapshots };
  };
  window.stateHooks.getSentryAppState = function () {
    const reduxState = store.getState();
    const controllerSnapshots = stateSubscriptionService.getAllSnapshots();
    return maskObject(
      { ...reduxState, metamask: controllerSnapshots },
      SENTRY_UI_STATE,
    );
  };
  window.stateHooks.getLogs = function () {
    const controllerSnapshots = stateSubscriptionService.getAllSnapshots();
    const { logs } = controllerSnapshots.LoggingController ?? {};
    if (!logs) {
      return [];
    }
    return Object.values(logs).sort((a, b) => a.timestamp - b.timestamp);
  };
}

window.logStateString = async function (cb) {
  const state = await window.stateHooks.getCleanAppState();
  const logs = window.stateHooks.getLogs();
  browser.runtime
    .getPlatformInfo()
    .then((platform) => {
      state.platform = platform;
      state.logs = logs;
      const stateString = JSON.stringify(state, null, 2);
      cb(null, stateString);
    })
    .catch((err) => {
      cb(err);
    });
};

window.logState = function (toClipboard) {
  return window.logStateString((err, result) => {
    if (err) {
      console.error(err.message);
    } else if (toClipboard) {
      copyToClipboard(result, COPY_OPTIONS);
      console.log('State log copied');
    } else {
      console.log(result);
    }
  });
};
