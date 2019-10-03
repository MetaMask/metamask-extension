import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
const actions = require('../../store/actions')

import {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  conversionRateSelector,
} from '../../selectors/selectors.js'
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component'

function mapStateToProps (state) {
  const { confirmTransaction } = state
  const {
    txData = {},
  } = confirmTransaction

  return {
    txData: txData,
    balance: getSelectedAccount(state).balance,
    selectedAccount: getCurrentAccountWithSendEtherInfo(state),
    selectedAddress: getSelectedAddress(state),
    requester: null,
    requesterAddress: null,
    conversionRate: conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    encryptionPublicKey: (msgData, event) => {
      const params = { data: msgData.msgParams, metamaskId: msgData.id}
      event.stopPropagation()
      return dispatch(actions.encryptionPublicKeyMsg(params))
    },
    cancelEncryptionPublicKey: (msgData, event) => {
      event.stopPropagation()
      return dispatch(actions.cancelEncryptionPublicKeyMsg(msgData))
    },
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(ConfirmEncryptionPublicKey)
