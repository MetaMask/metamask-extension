import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router-dom'

import { goHome } from '../../../store/actions'
import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
} from '../../../selectors'
import { getAccountByAddress } from '../../../helpers/utils/util'
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck'
import SignatureRequestOriginal from './signature-request-original.component'

function mapStateToProps (state) {
  return {
    requester: null,
    requesterAddress: null,
    conversionRate: conversionRateSelector(state),
    // not passed to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {
    signPersonalMessage,
    signTypedMessage,
    cancelPersonalMessage,
    cancelTypedMessage,
    signMessage,
    cancelMessage,
    txData,
  } = ownProps

  const { allAccounts } = stateProps
  delete stateProps.allAccounts

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
    ...stateProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancel,
    sign,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(SignatureRequestOriginal)
