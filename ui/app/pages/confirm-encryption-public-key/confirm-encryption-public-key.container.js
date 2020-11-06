import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router-dom'

import {
  goHome,
  encryptionPublicKeyMsg,
  cancelEncryptionPublicKeyMsg,
} from '../../store/actions'

import {
  conversionRateSelector,
  getTargetAccountWithSendEtherInfo,
} from '../../selectors'

import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import { getMostRecentOverviewPage } from '../../ducks/history/history'
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component'

function mapStateToProps(state) {
  const {
    confirmTransaction,
    metamask: { domainMetadata = {} },
  } = state

  const { txData = {} } = confirmTransaction

  const { msgParams: from } = txData

  const fromAccount = getTargetAccountWithSendEtherInfo(state, from)

  return {
    txData,
    domainMetadata,
    fromAccount,
    requester: null,
    requesterAddress: null,
    conversionRate: conversionRateSelector(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  }
}

function mapDispatchToProps(dispatch) {
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
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmEncryptionPublicKey)
