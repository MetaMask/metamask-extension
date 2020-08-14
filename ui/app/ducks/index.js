import { combineReducers } from 'redux'
import { ALERT_TYPES } from '../../../app/scripts/controllers/alert'
import metamaskReducer from './metamask/metamask'
import localeMessagesReducer from './locale/locale'
import sendReducer from './send/send.duck'
import appStateReducer from './app/app'
import confirmTransactionReducer from './confirm-transaction/confirm-transaction.duck'
import gasReducer from './gas/gas.duck'
import { unconnectedAccount } from './alerts'
import historyReducer from './history/history'

export default combineReducers({
  [ALERT_TYPES.unconnectedAccount]: unconnectedAccount,
  activeTab: (s) => (s === undefined ? null : s),
  metamask: metamaskReducer,
  appState: appStateReducer,
  history: historyReducer,
  send: sendReducer,
  confirmTransaction: confirmTransactionReducer,
  gas: gasReducer,
  localeMessages: localeMessagesReducer,
})
