import copyToClipboard from 'copy-to-clipboard';
import log from 'loglevel';
import { clone, memoize } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import browser from 'webextension-polyfill';

import { getEnvironmentType } from '../app/scripts/lib/util';
import { ALERT_TYPES } from '../shared/constants/alerts';
import { maskObject } from '../shared/modules/object.utils';
import { SENTRY_STATE } from '../app/scripts/lib/setupSentry';
import { ENVIRONMENT_TYPE_POPUP } from '../shared/constants/app';
import * as actions from './store/actions';
import configureStore from './store/store';
import {
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from './helpers/utils/i18n-helper';
import switchDirection from './helpers/utils/switch-direction';
import {
  getPermittedAccountsForCurrentTab,
  getSelectedAddress,
} from './selectors';
import { ALERT_STATE } from './ducks/alerts';
import {
  getUnconnectedAccountAlertEnabledness,
  getUnconnectedAccountAlertShown,
} from './ducks/metamask/metamask';
import Root from './pages';
import txHelper from './helpers/utils/tx-helper';

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn');

export default function launchMetamaskUi(opts, cb) {
  const { backgroundConnection } = opts;
  actions._setBackgroundConnection(backgroundConnection);
  // check if we are unlocked first
  backgroundConnection.getState(function (err, metamaskState) {
    if (err) {
      cb(err, metamaskState);
      return;
    }
    startApp(metamaskState, backgroundConnection, opts).then((store) => {
      setupDebuggingHelpers(store);
      cb(null, store);
    });
  });
}

const _setupLocale = async (currentLocale) => {
  const currentLocaleMessages = currentLocale
    ? await fetchLocale(currentLocale)
    : {};
  const enLocaleMessages = await fetchLocale('en');

  await loadRelativeTimeFormatLocaleData('en');
  if (currentLocale) {
    await loadRelativeTimeFormatLocaleData(currentLocale);
  }

  return { currentLocaleMessages, enLocaleMessages };
};

export const setupLocale = memoize(_setupLocale);

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
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },
  };

  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
    const { origin } = draftInitialState.activeTab;
    const permittedAccountsForCurrentTab = getPermittedAccountsForCurrentTab(
      draftInitialState,
    );
    const selectedAddress = getSelectedAddress(draftInitialState);
    const unconnectedAccountAlertShownOrigins = getUnconnectedAccountAlertShown(
      draftInitialState,
    );
    const unconnectedAccountAlertIsEnabled = getUnconnectedAccountAlertEnabledness(
      draftInitialState,
    );

    if (
      origin &&
      unconnectedAccountAlertIsEnabled &&
      !unconnectedAccountAlertShownOrigins[origin] &&
      permittedAccountsForCurrentTab.length > 0 &&
      !permittedAccountsForCurrentTab.includes(selectedAddress)
    ) {
      draftInitialState[ALERT_TYPES.unconnectedAccount] = {
        state: ALERT_STATE.OPEN,
      };
      actions.setUnconnectedAccountAlertShown(origin);
    }
  }

  const store = configureStore(draftInitialState);

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(
    metamaskState.unapprovedTxs,
    metamaskState.unapprovedMsgs,
    metamaskState.unapprovedPersonalMsgs,
    metamaskState.unapprovedDecryptMsgs,
    metamaskState.unapprovedEncryptionPublicKeyMsgs,
    metamaskState.unapprovedTypedMessages,
    metamaskState.network,
    metamaskState.provider.chainId,
  );
  const numberOfUnapprovedTx = unapprovedTxsAll.length;
  if (numberOfUnapprovedTx > 0) {
    store.dispatch(
      actions.showConfTxPage({
        id: unapprovedTxsAll[0].id,
      }),
    );
  }

  backgroundConnection.onNotification((data) => {
    if (data.method === 'sendUpdate') {
      store.dispatch(actions.updateMetamaskState(data.params[0]));
    } else {
      throw new Error(
        `Internal JSON-RPC Notification Not Handled:\n\n ${JSON.stringify(
          data,
        )}`,
      );
    }
  });

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

function setupDebuggingHelpers(store) {
  window.getCleanAppState = async function () {
    const state = clone(store.getState());
    state.version = global.platform.getVersion();
    state.browser = window.navigator.userAgent;
    state.completeTxList = await actions.getTransactions({
      filterToCurrentNetwork: false,
    });
    return state;
  };
  window.sentryHooks.getSentryState = function () {
    const fullState = store.getState();
    const debugState = maskObject(fullState, SENTRY_STATE);
    return {
      browser: window.navigator.userAgent,
      store: debugState,
      version: global.platform.getVersion(),
    };
  };
}

window.logStateString = async function (cb) {
  const state = await window.getCleanAppState();
  browser.runtime
    .getPlatformInfo()
    .then((platform) => {
      state.platform = platform;
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
      copyToClipboard(result);
      console.log('State log copied');
    } else {
      console.log(result);
    }
  });
};
