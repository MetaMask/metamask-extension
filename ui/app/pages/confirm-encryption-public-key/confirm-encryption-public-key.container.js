import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import { goHome, encryptionPublicKeyMsg, cancelEncryptionPublicKeyMsg } from '../../store/actions'

import {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  conversionRateSelector,
} from '../../selectors/selectors.js'
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component'

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
    encryptionPublicKey: (msgData, event) => {
      const params = { data: msgData.msgParams, metamaskId: msgData.id }
      event.stopPropagation()
      return dispatch(encryptionPublicKeyMsg(params))
    },
    cancelEncryptionPublicKey: (msgData, event) => {
      event.stopPropagation()
      return dispatch(cancelEncryptionPublicKeyMsg(msgData))
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmEncryptionPublicKey)
