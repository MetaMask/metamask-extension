import { connect } from 'react-redux'
import SignatureRequest from './signature-request.component'
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck'
import {
  accountsWithSendEtherInfoSelector,
} from '../../../selectors/selectors.js'
import { getAccountByAddress } from '../../../helpers/utils/util'

function mapStateToProps (state) {
  return {
    // not forwarded to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const { allAccounts } = stateProps
  const {
    signPersonalMessage,
    signTypedMessage,
    cancelPersonalMessage,
    cancelTypedMessage,
    signMessage,
    cancelMessage,
    txData,
  } = ownProps

  const { type, msgParams: { from } } = txData

  const fromAccount = getAccountByAddress(allAccounts, from)

  let cancel
  let sign

  if (type === 'personal_sign') {
    cancel = cancelPersonalMessage
    sign = signPersonalMessage
  } else if (type === 'eth_signTypedData') {
    cancel = cancelTypedMessage
    sign = signTypedMessage
  } else if (type === 'eth_sign') {
    cancel = cancelMessage
    sign = signMessage
  }

  return {
    ...ownProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancel,
    sign,
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SignatureRequest)
