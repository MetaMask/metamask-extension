import { connect } from 'react-redux'
import { compose } from 'recompose'
import ThreeBoxApprovalModal from './threebox-approval-modal.component'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import txHelper from '../../../../../lib/tx-helper'

import actions from '../../../../store/actions'
import R from 'ramda'

const mapStateToProps = (state, ownProps) => {
  const { id: sigId } = ownProps
  const { metamask } = state
  const {
    unapprovedPersonalMsgs,
  } = metamask

  const unconfSigList = txHelper([], unapprovedPersonalMsgs)

  const txData = R.find(({ id }) => id + '' === sigId + '')(unconfSigList)

  return {
    txData: txData || {},
  }
}

function msgDataToParams (msgData) {
  const params = msgData.msgParams
  params.metamaskId = msgData.id
  return params
}

const mapDispatchToProps = dispatch => {
  return {
    signPersonalMessage: msgData => dispatch(actions.signPersonalMsg(msgDataToParams(msgData))),
    cancelPersonalMessage: msgData => dispatch(actions.cancelPersonalMsg(msgData)),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ThreeBoxApprovalModal)
