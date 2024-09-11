import { promisify } from 'util';
import copyToClipboard from 'copy-to-clipboard';
import log from 'loglevel';
import { clone } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import browser from 'webextension-polyfill';

import { getEnvironmentType } from '../app/scripts/lib/util';
import { AlertTypes } from '../shared/constants/alerts';
import { maskObject } from '../shared/modules/object.utils';
import { SENTRY_UI_STATE } from '../app/scripts/constants/sentry-state';
import { ENVIRONMENT_TYPE_POPUP } from '../shared/constants/app';
import { COPY_OPTIONS } from '../shared/constants/copy';
import switchDirection from '../shared/lib/switch-direction';
import { setupLocale } from '../shared/lib/error-utils';
import { trace, TraceName } from '../shared/lib/trace';
import * as actions from './store/actions';
import configureStore from './store/store';
import {
  getOriginOfCurrentTab,
  getPermittedAccountsForCurrentTab,
  getSelectedInternalAccount,
  getUnapprovedTransactions,
  getNetworkToAutomaticallySwitchTo,
  getSwitchedNetworkDetails,
  getUseRequestQueue,
  getCurrentChainId,
} from './selectors';
import { ALERT_STATE } from './ducks/alerts';
import {
  getUnconnectedAccountAlertEnabledness,
  getUnconnectedAccountAlertShown,
} from './ducks/metamask/metamask';
import Root from './pages';
import txHelper from './helpers/utils/tx-helper';
import { setBackgroundConnection } from './store/background-connection';

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn', false);

let reduxStore;

/**
 * Method to update backgroundConnection object use by UI
 *
 * @param backgroundConnection - connection object to background
 */
export const updateBackgroundConnection = (backgroundConnection) => {
  setBackgroundConnection(backgroundConnection);
  backgroundConnection.onNotification((data) => {
    if (data.method === 'sendUpdate') {
      reduxStore.dispatch(actions.updateMetamaskState(data.params[0]));
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
    () => promisify(backgroundConnection.getState.bind(backgroundConnection))(),
  );

  const store = await startApp(metamaskState, backgroundConnection, opts);

  setupStateHooks(store);

  return store;
}

/**
 * Method to setup initial redux store for the ui application
 *
 * @param {*} metamaskState - flatten background state
 * @param {*} backgroundConnection - rpc client connecting to the background process
 * @param {*} activeTab - active browser tab
 * @returns redux store
 */
export async function setupInitialStore(
  metamaskState,
  backgroundConnection,
  activeTab,
) {
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

  updateBackgroundConnection(backgroundConnection);

  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
    const { origin } = draftInitialState.activeTab;
    const permittedAccountsForCurrentTab =
      getPermittedAccountsForCurrentTab(draftInitialState);
    const selectedAddress =
      getSelectedInternalAccount(draftInitialState)?.address ?? '';
    const unconnectedAccountAlertShownOrigins =
      getUnconnectedAccountAlertShown(draftInitialState);
    const unconnectedAccountAlertIsEnabled =
      getUnconnectedAccountAlertEnabledness(draftInitialState);

    if (
      origin &&
      unconnectedAccountAlertIsEnabled &&
      !unconnectedAccountAlertShownOrigins[origin] &&
      permittedAccountsForCurrentTab.length > 0 &&
      !permittedAccountsForCurrentTab.includes(selectedAddress)
    ) {
      draftInitialState[AlertTypes.unconnectedAccount] = {
        state: ALERT_STATE.OPEN,
      };
      actions.setUnconnectedAccountAlertShown(origin);
    }
  }

  const store = configureStore(draftInitialState);
  reduxStore = store;

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

async function startApp(metamaskState, backgroundConnection, opts) {
  const { traceContext } = opts;

  const store = await trace(
    { name: TraceName.SetupStore, parentContext: traceContext },
    () =>
      setupInitialStore(metamaskState, backgroundConnection, opts.activeTab),
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
  const state = store.getState();

  // This block autoswitches chains based on the last chain used
  // for a given dapp, when there are no pending confimrations
  // This allows the user to be connected on one chain
  // for one dapp, and automatically change for another
  const networkIdToSwitchTo = getNetworkToAutomaticallySwitchTo(state);

  if (networkIdToSwitchTo) {
    await store.dispatch(
      actions.automaticallySwitchNetwork(
        networkIdToSwitchTo,
        getOriginOfCurrentTab(state),
      ),
    );
  } else if (getSwitchedNetworkDetails(state)) {
    // It's possible that old details could exist if the user
    // opened the toast but then didn't close it
    // Clear out any existing switchedNetworkDetails
    // if the user didn't just change the dapp network
    await store.dispatch(actions.clearSwitchedNetworkDetails());
  }

  // Register this window as the current popup
  // and set in background state
  if (
    getUseRequestQueue(state) &&
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
  ) {
    const thisPopupId = Date.now();
    global.metamask.id = thisPopupId;
    await store.dispatch(actions.setCurrentExtensionPopupId(thisPopupId));
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
     * our E2E test to ensure that errors are attempted to be sent to sentry.
     *
     * @param {string} [msg] - The error message to throw, defaults to 'Test Error'
     */
    window.stateHooks.throwTestError = async function (msg = 'Test Error') {
      const error = new Error(msg);
      error.name = 'TestError';
      throw error;
    };
    /**
     * The following stateHook is a method intended to throw an error in the
     * background, used in our E2E test to ensure that errors are attempted to be
     * sent to sentry.
     *
     * @param {string} [msg] - The error message to throw, defaults to 'Test Error'
     */
    window.stateHooks.throwTestBackgroundError = async function (
      msg = 'Test Error',
    ) {
      await actions.throwTestBackgroundError(msg);
    };
  }

  window.stateHooks.getCleanAppState = async function () {
    const state = clone(store.getState());
    // we use the manifest.json version from getVersion and not
    // `process.env.METAMASK_VERSION` as they can be different (see `getVersion`
    // for more info)
    state.version = global.platform.getVersion();
    state.browser = window.navigator.userAgent;
    state.completeTxList = await actions.getTransactions({
      filterToCurrentNetwork: false,
    });
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

// Check for local feature flags and represent them so they're avialable
// to the front-end of the app
window.metamaskFeatureFlags = {
  networkMenuRedesign: Boolean(process.env.ENABLE_NETWORK_UI_REDESIGN),
};

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
