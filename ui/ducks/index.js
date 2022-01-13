import { combineReducers } from 'redux';
import { ALERT_TYPES } from '../../shared/constants/alerts';
import metamaskReducer from './metamask/metamask';
import localeMessagesReducer from './locale/locale';
import sendReducer from './send/send';
import ensReducer from './ens';
import appStateReducer from './app/app';
import confirmTransactionReducer from './confirm-transaction/confirm-transaction.duck';
import gasReducer from './gas/gas.duck';
import { invalidCustomNetwork, unconnectedAccount } from './alerts';
import swapsReducer from './swaps/swaps';
import historyReducer from './history/history';

export default combineReducers({
  [ALERT_TYPES.invalidCustomNetwork]: invalidCustomNetwork,
  [ALERT_TYPES.unconnectedAccount]: unconnectedAccount,
  activeTab: (s) => (s === undefined ? null : s),
  metamask: metamaskReducer,
  appState: appStateReducer,
  ENS: ensReducer,
  history: historyReducer,
  send: sendReducer,
  confirmTransaction: confirmTransactionReducer,
  swaps: swapsReducer,
  gas: gasReducer,
  localeMessages: localeMessagesReducer,
});
