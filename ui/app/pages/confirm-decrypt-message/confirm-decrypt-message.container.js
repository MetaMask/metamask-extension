import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router-dom'

import {
  goHome,
  decryptMsg,
  cancelDecryptMsg,
  decryptMsgInline,
} from '../../store/actions'
import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
} from '../../selectors/selectors.js'
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import { getAccountByAddress } from '../../helpers/utils/util'
import ConfirmDecryptMessage from './confirm-decrypt-message.component'

function mapStateToProps (state) {
  const { confirmTransaction,
    metamask: { domainMetadata = {} },
  } = state

  const {
    txData = {},
  } = confirmTransaction

  const { msgParams: { from } } = txData

  const allAccounts = accountsWithSendEtherInfoSelector(state)
  const fromAccount = getAccountByAddress(allAccounts, from)

  return {
    txData: txData,
    domainMetadata,
    fromAccount,
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
