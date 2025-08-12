import copyToClipboard from 'copy-to-clipboard';
import log from 'loglevel';
import { clone } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import browser from 'webextension-polyfill';
import { isInternalAccountInPermittedAccountIds } from '@metamask/chain-agnostic-permission';

import { captureException } from '../shared/lib/sentry';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../app/scripts/lib/util';
import { AlertTypes } from '../shared/constants/alerts';
import { maskObject } from '../shared/modules/object.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { SENTRY_UI_STATE } from '../app/scripts/constants/sentry-state';
import { ENVIRONMENT_TYPE_POPUP } from '../shared/constants/app';
import { COPY_OPTIONS } from '../shared/constants/copy';
import { switchDirection } from '../shared/lib/switch-direction';
import { setupLocale } from '../shared/lib/error-utils';
import { trace, TraceName } from '../shared/lib/trace';
import { getCurrentChainId } from '../shared/modules/selectors/networks';
import * as actions from './store/actions';
import configureStore from './store/store';
import {
  getSelectedInternalAccount,
  getUnapprovedTransactions,
  getNetworkToAutomaticallySwitchTo,
  getAllPermittedAccountsForCurrentTab,
} from './selectors';
import { ALERT_STATE } from './ducks/alerts';
import {
  getIsUnlocked,
  getUnconnectedAccountAlertEnabledness,
  getUnconnectedAccountAlertShown,
} from './ducks/metamask/metamask';
import Root from './pages';
import txHelper from './helpers/utils/tx-helper';
import { setBackgroundConnection } from './store/background-connection';
import { getStartupTraceTags } from './helpers/utils/tags';
import { SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS } from './constants';

export { CriticalStartupErrorHandler } from './helpers/utils/critical-startup-error-handler';
export {
  displayCriticalError,
  CriticalErrorTranslationKey,
} from './helpers/utils/display-critical-error';

const METHOD_START_UI_SYNC = 'startUISync';

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn', false);

/**
 * @type {PromiseWithResolvers<ReturnType<typeof configureStore>>}
 */
const reduxStore = Promise.withResolvers();

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
      const store = await reduxStore.promise;
      store.dispatch(actions.updateMetamaskState(data.params[0]));
    } else if (method === METHOD_START_UI_SYNC) {
      await handleStartUISync();
    } else {
      throw new Error(
        `Internal JSON-RPC Notification Not Handled:\n\n ${JSON.stringify(
          data,
        )}`,
      );
    }
  });
};

export default async function launchMetamaskUi(opts) {
  const { backgroundConnection, traceContext } = opts;

  const metamaskState = await trace(
    { name: TraceName.GetState, parentContext: traceContext },
    backgroundConnection.getState.bind(backgroundConnection),
  );

  const store = await startApp(metamaskState, opts);

  await backgroundConnection.startPatches();

  setupStateHooks(store);

  return store;
}

/**
 * Method to setup initial redux store for the ui application
 *
 * @param {*} metamaskState - flatten background state
 * @param {*} activeTab - active browser tab
 * @returns redux store
 */
export async function setupInitialStore(metamaskState, activeTab) {
  // parse opts
  if (!metamaskState.featureFlags) {
    metamaskState.featureFlags = {};
  }

  const { currentLocaleMessages, enLocaleMessages } = await setupLocale(
    metamaskState.currentLocale,
  );

  if (metamaskState.textDirection === 'rtl') {
    switchDirection('rtl');
  }

  const draftInitialState = {
    activeTab,

    // metamaskState represents the cross-tab state
    metamask: metamaskState,

    // appState represents the current tab's popup state
    appState: {},

    localeMessages: {
      currentLocale: metamaskState.currentLocale,
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },
  };

  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
    const { origin } = draftInitialState.activeTab;
    const permittedAccountsForCurrentTab =
      getAllPermittedAccountsForCurrentTab(draftInitialState);

    const selectedAccount = getSelectedInternalAccount(draftInitialState);

    const currentTabIsConnectedToSelectedAddress =
      selectedAccount &&
      isInternalAccountInPermittedAccountIds(
        selectedAccount,
        permittedAccountsForCurrentTab,
      );

    const unconnectedAccountAlertShownOrigins =
      getUnconnectedAccountAlertShown(draftInitialState);
    const unconnectedAccountAlertIsEnabled =
      getUnconnectedAccountAlertEnabledness(draftInitialState);

    if (
      origin &&
      unconnectedAccountAlertIsEnabled &&
      !unconnectedAccountAlertShownOrigins[origin] &&
      permittedAccountsForCurrentTab.length > 0 &&
      !currentTabIsConnectedToSelectedAddress
    ) {
      draftInitialState[AlertTypes.unconnectedAccount] = {
        state: ALERT_STATE.OPEN,
      };
      actions.setUnconnectedAccountAlertShown(origin);
    }
  }

  const store = configureStore(draftInitialState);
  reduxStore.resolve(store);

  const unapprovedTxs = getUnapprovedTransactions(metamaskState);

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(
    unapprovedTxs,
    metamaskState.unapprovedPersonalMsgs,
    metamaskState.unapprovedDecryptMsgs,
    metamaskState.unapprovedEncryptionPublicKeyMsgs,
    metamaskState.unapprovedTypedMessages,
    metamaskState.networkId,
    getCurrentChainId({ metamask: metamaskState }),
  );
  const numberOfUnapprovedTx = unapprovedTxsAll.length;
  if (numberOfUnapprovedTx > 0) {
    store.dispatch(
      actions.showConfTxPage({
        id: unapprovedTxsAll[0].id,
      }),
    );
  }

  return store;
}

async function startApp(metamaskState, opts) {
  const { traceContext } = opts;

  const tags = getStartupTraceTags({ metamask: metamaskState });

  const store = await trace(
    {
      name: TraceName.SetupStore,
      parentContext: traceContext,
      tags,
    },
    () => setupInitialStore(metamaskState, opts.activeTab),
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
    render(<Root store={store} />, opts.container),
  );

  return store;
}

async function runInitialActions(store) {
  const initialState = store.getState();

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
    setInterval(() => {
      const state = store.getState();
      validateSeedlessPasswordOutdated(state);
    }, SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS);
  } catch (e) {
    log.error('[Metamask] checkIsSeedlessPasswordOutdated error', e);
  }
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

  window.stateHooks.getCleanAppState = async function () {
    const state = clone(store.getState());
    // we use the manifest.json version from getVersion and not
    // `process.env.METAMASK_VERSION` as they can be different (see `getVersion`
    // for more info)
    state.version = global.platform.getVersion();
    state.browser = window.navigator.userAgent;
    return state;
  };
  window.stateHooks.getSentryAppState = function () {
    const reduxState = store.getState();
    return maskObject(reduxState, SENTRY_UI_STATE);
  };
  window.stateHooks.getLogs = function () {
    // These logs are logged by LoggingController
    const reduxState = store.getState();
    const { logs } = reduxState.metamask;

    const logsArray = Object.values(logs).sort((a, b) => {
      return a.timestamp - b.timestamp;
    });

    return logsArray;
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
