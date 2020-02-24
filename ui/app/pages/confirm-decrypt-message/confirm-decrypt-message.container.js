import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router-dom'
import { goHome, decryptMsg, cancelDecryptMsg, decryptMsgInline } from '../../store/actions'

import {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  conversionRateSelector,
} from '../../selectors/selectors.js'
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import ConfirmDecryptMessage from './confirm-decrypt-message.component'

function mapStateToProps (state) {
  const { confirmTransaction,
    metamask: { domainMetadata = {} },
  } = state

  const {
    txData = {},
  } = confirmTransaction

  return {
    txData: txData,
    domainMetadata: domainMetadata,
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
    goHome: () => dispatch(goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    decryptMessage: (msgData, event) => {
      const params = msgData.msgParams
      params.metamaskId = msgData.id
      event.stopPropagation(event)
      return dispatch(decryptMsg(params))
    },
    cancelDecryptMessage: (msgData, event) => {
      event.stopPropagation(event)
      return dispatch(cancelDecryptMsg(msgData))
    },
    decryptMessageInline: (msgData, event) => {
      const params = msgData.msgParams
      params.metamaskId = msgData.id
      event.stopPropagation(event)
      return dispatch(decryptMsgInline(params))
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmDecryptMessage)
