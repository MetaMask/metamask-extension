import { combineReducers } from 'redux'
import metamaskReducer from './metamask/metamask'
import localeMessagesReducer from './locale/locale'
import sendReducer from './send/send.duck'
import appStateReducer from './app/app'
import confirmTransactionReducer from './confirm-transaction/confirm-transaction.duck'
import gasReducer from './gas/gas.duck'
import * as alerts from './alerts'

export default combineReducers({
  ...alerts,
  activeTab: (s) => (s === undefined ? null : s),
  metamask: metamaskReducer,
  appState: appStateReducer,
  send: sendReducer,
  confirmTransaction: confirmTransactionReducer,
  gas: gasReducer,
  localeMessages: localeMessagesReducer,
})
