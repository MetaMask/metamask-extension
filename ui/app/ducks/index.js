import { combineReducers } from 'redux'
import metamaskReducer from './metamask/metamask'
import localeMessagesReducer from './locale/locale'
import sendReducer from './send/send.duck'
import appStateReducer from './app/app'
import confirmTransactionReducer from './confirm-transaction/confirm-transaction.duck'
import gasReducer from './gas/gas.duck'
import { switchToConnected, unconnectedAccount } from './alerts'
import { ALERT_TYPES } from '../../../app/scripts/controllers/alert'

export default combineReducers({
  [ALERT_TYPES.switchToConnected]: switchToConnected,
  [ALERT_TYPES.unconnectedAccount]: unconnectedAccount,
  activeTab: (s) => (s === undefined ? null : s),
  metamask: metamaskReducer,
  appState: appStateReducer,
  send: sendReducer,
  confirmTransaction: confirmTransactionReducer,
  gas: gasReducer,
  localeMessages: localeMessagesReducer,
})
