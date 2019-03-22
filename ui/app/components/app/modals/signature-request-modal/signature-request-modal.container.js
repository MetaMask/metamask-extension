import { connect } from 'react-redux'
import { compose } from 'recompose'
import SignatureRequestModal from './signature-request-modal.component'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import txHelper from '../../../../../lib/tx-helper'
import {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
} from '../../../../selectors/selectors.js'
import actions from '../../../../store/actions'
import { clearConfirmTransaction } from '../../../../ducks/confirm-transaction/confirm-transaction.duck'
import R from 'ramda'

const mapStateToProps = (state, ownProps) => {
  const { id: sigId } = ownProps
  const { metamask } = state
  const {
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
  } = metamask

  const unconfSigList = txHelper(
    [],
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
  )
  const txData = R.find(({ id }) => id + '' === sigId + '')(unconfSigList)

  return {
    txData: txData || {},
    key: txData && txData.id,
    balance: getSelectedAccount(state).balance,
    selectedAccount: getCurrentAccountWithSendEtherInfo(state),
    selectedAddress: getSelectedAddress(state),
    requester: null,
    requesterAddress: null,
    accounts: accountsWithSendEtherInfoSelector(state),
    conversionRate: conversionRateSelector(state),
  }
}

function msgDataToParams (msgData) {
  const params = msgData.msgParams
  params.metamaskId = msgData.id
  return params
}

const mapDispatchToProps = dispatch => {
  return {
    signMessage: msgData => dispatch(actions.signMsg(msgDataToParams(msgData))),
    signPersonalMessage: msgData => dispatch(actions.signPersonalMsg(msgDataToParams(msgData))),
    signTypedMessage: msgData => dispatch(actions.signTypedMsg(msgDataToParams(msgData))),
    cancelMessage: msgData => dispatch(actions.cancelMsg(msgData)),
    cancelPersonalMessage: msgData => dispatch(actions.cancelPersonalMsg(msgData)),
    cancelTypedMessage: msgData => dispatch(actions.cancelTypedMsg(msgData)),
    goHome: () => dispatch(actions.goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(SignatureRequestModal)
