import copyToClipboard from 'copy-to-clipboard';
import log from 'loglevel';
import { clone } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import browser from 'webextension-polyfill';

import { getEnvironmentType } from '../app/scripts/lib/util';
import { AlertTypes } from '../shared/constants/alerts';
import { maskObject } from '../shared/modules/object.utils';
import { SENTRY_UI_STATE } from '../app/scripts/lib/setupSentry';
import { ENVIRONMENT_TYPE_POPUP } from '../shared/constants/app';
import { COPY_OPTIONS } from '../shared/constants/copy';
import switchDirection from '../shared/lib/switch-direction';
import { setupLocale } from '../shared/lib/error-utils';
import * as actions from './store/actions';
import configureStore from './store/store';
import {
  getPermittedAccountsForCurrentTab,
  getSelectedAddress,
  getUnapprovedTransactions,
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

export default function launchMetamaskUi(opts, cb) {
  const { backgroundConnection } = opts;
  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  let desktopEnabled = false;

  backgroundConnection.getDesktopEnabled(function (err, result) {
    if (err) {
      return;
    }

    desktopEnabled = result;
  });
  ///: END:ONLY_INCLUDE_IF

  // check if we are unlocked first
  backgroundConnection.getState(function (err, metamaskState) {
    if (err) {
      cb(
        err,
        {
          ...metamaskState,
          ///: BEGIN:ONLY_INCLUDE_IF(desktop)
          desktopEnabled,
          ///: END:ONLY_INCLUDE_IF
        },
        backgroundConnection,
      );
      return;
    }
    startApp(metamaskState, backgroundConnection, opts).then((store) => {
      setupStateHooks(store);
      cb(
        null,
        store,
        ///: BEGIN:ONLY_INCLUDE_IF(desktop)
        backgroundConnection,
        ///: END:ONLY_INCLUDE_IF
      );
    });
  });
}

async function startApp(metamaskState, backgroundConnection, opts) {
  // parse opts
  if (!metamaskState.featureFlags) {
    metamaskState.featureFlags = {};
  }

  const { currentLocaleMessages, enLocaleMessages } = await setupLocale(
    metamaskState.currentLocale,
  );

  if (metamaskState.textDirection === 'rtl') {
    await switchDirection('rtl');
  }

  const draftInitialState = {
    activeTab: opts.activeTab,

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
    const selectedAddress = getSelectedAddress(draftInitialState);
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
    metamaskState.unapprovedMsgs,
    metamaskState.unapprovedPersonalMsgs,
    metamaskState.unapprovedDecryptMsgs,
    metamaskState.unapprovedEncryptionPublicKeyMsgs,
    metamaskState.unapprovedTypedMessages,
    metamaskState.providerConfig.chainId,
  );
  const numberOfUnapprovedTx = unapprovedTxsAll.length;
  if (numberOfUnapprovedTx > 0) {
    store.dispatch(
      actions.showConfTxPage({
        id: unapprovedTxsAll[0].id,
      }),
    );
  }

  // global metamask api - used by tooling
  global.metamask = {
    updateCurrentLocale: (code) => {
      store.dispatch(actions.updateCurrentLocale(code));
    },
    setProviderType: (type) => {
      store.dispatch(actions.setProviderType(type));
    },
    setFeatureFlag: (key, value) => {
      store.dispatch(actions.setFeatureFlag(key, value));
    },
  };

  // start app
  render(<Root store={store} />, opts.container);

  return store;
}

/**
 * Setup functions on `window.stateHooks`. Some of these support
 * application features, and some are just for debugging or testing.
 *
 * @param {object} store - The Redux store.
 */
function setupStateHooks(store) {
  if (process.env.METAMASK_DEBUG || process.env.IN_TEST) {
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
      store.dispatch(actions.throwTestBackgroundError(msg));
    };
  }

  window.stateHooks.getCleanAppState = async function () {
    const state = clone(store.getState());
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
