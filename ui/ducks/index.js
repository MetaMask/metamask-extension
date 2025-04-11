import { combineReducers } from 'redux';

import { AlertTypes } from '../../shared/constants/alerts';
import { invalidCustomNetwork, unconnectedAccount } from './alerts';
import appStateReducer from './app/app';
import bridgeReducer from './bridge/bridge';
import confirmAlertsReducer from './confirm-alerts/confirm-alerts';
import confirmTransactionReducer from './confirm-transaction/confirm-transaction.duck';
import domainReducer from './domains';
import gasReducer from './gas/gas.duck';
import historyReducer from './history/history';
import localeMessagesReducer from './locale/locale';
import metamaskReducer from './metamask/metamask';
import rampsReducer from './ramps/ramps';
import sendReducer from './send/send';
import swapsReducer from './swaps/swaps';

export default combineReducers({
  [AlertTypes.invalidCustomNetwork]: invalidCustomNetwork,
  [AlertTypes.unconnectedAccount]: unconnectedAccount,
  activeTab: (s) => (s === undefined ? null : s),
  metamask: metamaskReducer,
  appState: appStateReducer,
  DNS: domainReducer,
  history: historyReducer,
  send: sendReducer,
  confirmAlerts: confirmAlertsReducer,
  confirmTransaction: confirmTransactionReducer,
  swaps: swapsReducer,
  ramps: rampsReducer,
  bridge: bridgeReducer,
  gas: gasReducer,
  localeMessages: localeMessagesReducer,
});
